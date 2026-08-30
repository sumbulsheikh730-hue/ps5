"""
Human-in-the-Loop (HITL) API  –  PRAKRITI
==========================================
Flow:
  1. POST /api/hitl/generate           – AI scans active incidents and creates pending
                                         recommendation records for villages that don't
                                         already have a pending one.
  2. GET  /api/hitl/recommendations    – List all recommendation records (filterable by status).
  3. POST /api/hitl/{id}/approve       – Officer approves; deploys recommended resources.
  4. POST /api/hitl/{id}/reject        – Officer rejects with a note; no deployment.
  5. POST /api/hitl/{id}/reassess      – Recalculates AI scores from current data.
  6. GET  /api/hitl/audit              – Full audit trail ordered by last update.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import HITLRecommendation, Incident, Village, Resource, ActivityLog, Report, Contradiction
from app.ai.scoring import (
    compute_rescue_priority,
    compute_evidence_confidence,
    compute_information_fog,
    compute_accessibility_score,
    _what_resources_needed,
)
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/hitl", tags=["hitl"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class DecisionBody(BaseModel):
    officer_name: Optional[str] = "District Officer"
    note: Optional[str] = None


# ── Serializer ────────────────────────────────────────────────────────────────

def _serialize(rec: HITLRecommendation, village_name: str = "") -> dict:
    return {
        "id": rec.id,
        "village_id": rec.village_id,
        "village_name": village_name or rec.village_id,
        "ai_action": rec.ai_action,
        "ai_reasoning": rec.ai_reasoning or [],
        "priority_class": rec.priority_class,
        "priority_score": rec.priority_score,
        "recommended_resources": rec.recommended_resources or [],
        "fog_score": rec.fog_score,
        "confidence_score": rec.confidence_score,
        "people_at_risk": rec.people_at_risk,
        "disaster_types": rec.disaster_types or [],
        "status": rec.status,
        "officer_name": rec.officer_name,
        "officer_note": rec.officer_note,
        "decided_at": rec.decided_at.isoformat() if rec.decided_at else None,
        "reassessment_count": rec.reassessment_count,
        "created_at": rec.created_at.isoformat() if rec.created_at else None,
        "updated_at": rec.updated_at.isoformat() if rec.updated_at else None,
    }


# ── Helper: build an AI recommendation from an active incident ────────────────

async def _build_recommendation(
    inc: Incident,
    village: Village,
    db: AsyncSession,
) -> dict:
    """Return a dict of AI-computed fields for a given incident/village pair."""

    # Gather reports
    reports_result = await db.execute(
        select(Report).where(Report.village_id == village.id)
    )
    reports = [
        {
            "source_type": r.source_type,
            "is_verified": r.is_verified,
            "timestamp": r.timestamp,
            "severity": r.severity,
        }
        for r in reports_result.scalars().all()
    ]

    # Gather contradictions
    contras_result = await db.execute(
        select(Contradiction).where(Contradiction.village_id == village.id)
    )
    contradictions = [{"id": c.id} for c in contras_result.scalars().all()]

    village_dict = {
        "id": village.id,
        "population": village.population,
        "block": village.block,
    }
    incident_dict = {
        "disaster_types": inc.disaster_types or [],
        "severity": inc.severity,
        "medical_emergencies": inc.medical_emergencies,
        "people_stranded": inc.people_stranded,
        "people_at_risk": inc.people_at_risk,
        "assigned_resources": inc.assigned_resources or [],
    }

    conf = compute_evidence_confidence(reports, village_dict)
    fog  = compute_information_fog(reports, village_dict, contradictions)
    # Accessibility uses an empty road list for speed; existing score is used
    priority = compute_rescue_priority(
        village_dict, incident_dict,
        conf["score"], inc.accessibility_score, fog["score"]
    )

    # Recommended resource types
    needed_types = _what_resources_needed(inc.disaster_types or [], incident_dict)
    available_resources_result = await db.execute(
        select(Resource).where(Resource.status == "available")
    )
    available = available_resources_result.scalars().all()

    rec_resources = []
    used_ids = set()
    for rtype in needed_types:
        match = next(
            (r for r in available if r.resource_type == rtype and r.id not in used_ids),
            None
        )
        if match:
            used_ids.add(match.id)
            rec_resources.append({
                "id": match.id,
                "name": match.name,
                "type": match.resource_type,
            })

    # Build natural-language action string
    if rec_resources:
        resource_names = ", ".join(r["name"] for r in rec_resources)
        ai_action = f"Deploy {resource_names} to {village.name} ({priority['class']} – score {priority['score']:.0f})"
    else:
        ai_action = f"No available resources match needs for {village.name} — flag for manual sourcing"

    return {
        "ai_action": ai_action,
        "ai_reasoning": priority["explanation"],
        "priority_class": priority["class"],
        "priority_score": priority["score"],
        "recommended_resources": rec_resources,
        "fog_score": fog["score"],
        "confidence_score": conf["score"],
        "people_at_risk": inc.people_at_risk,
        "disaster_types": inc.disaster_types or [],
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_recommendations(db: AsyncSession = Depends(get_db)):
    """
    Scan all active incidents and create a pending HITL recommendation for any
    village that doesn't already have one awaiting officer review.
    """
    # Active incidents ordered by priority
    incidents_result = await db.execute(
        select(Incident, Village)
        .join(Village, Incident.village_id == Village.id)
        .where(Incident.is_active == True)
        .order_by(Incident.rescue_priority_score.desc())
    )
    rows = incidents_result.all()

    # Villages that already have a pending/approved recommendation (avoid duplicates)
    existing_result = await db.execute(
        select(HITLRecommendation).where(
            HITLRecommendation.status.in_(["pending", "reassessing"])
        )
    )
    pending_villages = {r.village_id for r in existing_result.scalars().all()}

    created = []
    for inc, village in rows:
        if village.id in pending_villages:
            continue  # already awaiting a decision

        fields = await _build_recommendation(inc, village, db)

        rec = HITLRecommendation(
            id=str(uuid.uuid4())[:8],
            village_id=village.id,
            status="pending",
            is_demo=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            **fields,
        )
        db.add(rec)
        pending_villages.add(village.id)
        created.append(rec.id)

    await db.commit()
    return {"created": len(created), "ids": created}


@router.get("/recommendations")
async def list_recommendations(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all HITL recommendation records, newest first."""
    q = select(HITLRecommendation).order_by(HITLRecommendation.created_at.desc())
    if status:
        q = q.where(HITLRecommendation.status == status)
    result = await db.execute(q)
    recs = result.scalars().all()

    # Resolve village names in one pass
    village_ids = list({r.village_id for r in recs})
    villages_result = await db.execute(
        select(Village).where(Village.id.in_(village_ids))
    )
    village_map = {v.id: v.name for v in villages_result.scalars().all()}

    return [_serialize(r, village_map.get(r.village_id, "")) for r in recs]


@router.post("/{rec_id}/approve")
async def approve_recommendation(
    rec_id: str,
    body: DecisionBody,
    db: AsyncSession = Depends(get_db),
):
    """
    Officer approves the AI recommendation.
    Marks the record as approved and actually deploys the recommended resources.
    """
    rec = await db.get(HITLRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.status not in ("pending", "reassessing"):
        raise HTTPException(status_code=400, detail=f"Cannot approve a recommendation in '{rec.status}' state")

    # Deploy each recommended resource
    deployed = []
    for res_info in (rec.recommended_resources or []):
        resource = await db.get(Resource, res_info["id"])
        if resource and resource.status == "available":
            resource.status = "deployed"
            resource.assigned_village_id = rec.village_id

            # Append to incident assigned list
            inc_result = await db.execute(
                select(Incident).where(Incident.village_id == rec.village_id)
            )
            inc = inc_result.scalars().first()
            if inc:
                assigned = list(inc.assigned_resources or [])
                if resource.name not in assigned:
                    assigned.append(resource.name)
                inc.assigned_resources = assigned

            deployed.append(resource.name)

    # Update recommendation record
    rec.status = "approved"
    rec.officer_name = body.officer_name
    rec.officer_note = body.note
    rec.decided_at = datetime.utcnow()
    rec.updated_at = datetime.utcnow()

    # Activity log
    village = await db.get(Village, rec.village_id)
    db.add(ActivityLog(
        id=str(uuid.uuid4())[:8],
        event_type="hitl_approved",
        severity="info",
        title=f"Officer approved AI recommendation for {village.name if village else rec.village_id}",
        body=f"Officer: {body.officer_name}. Resources deployed: {', '.join(deployed) or 'none'}. Note: {body.note or '—'}",
        village_id=rec.village_id,
        is_demo=False,
        timestamp=datetime.utcnow(),
    ))

    await db.commit()
    return {
        "success": True,
        "deployed": deployed,
        "recommendation": _serialize(rec, village.name if village else ""),
    }


@router.post("/{rec_id}/reject")
async def reject_recommendation(
    rec_id: str,
    body: DecisionBody,
    db: AsyncSession = Depends(get_db),
):
    """
    Officer rejects the AI recommendation, providing a reason.
    No resources are deployed.
    """
    rec = await db.get(HITLRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.status not in ("pending", "reassessing"):
        raise HTTPException(status_code=400, detail=f"Cannot reject a recommendation in '{rec.status}' state")

    rec.status = "rejected"
    rec.officer_name = body.officer_name
    rec.officer_note = body.note
    rec.decided_at = datetime.utcnow()
    rec.updated_at = datetime.utcnow()

    village = await db.get(Village, rec.village_id)
    db.add(ActivityLog(
        id=str(uuid.uuid4())[:8],
        event_type="hitl_rejected",
        severity="warning",
        title=f"Officer rejected AI recommendation for {village.name if village else rec.village_id}",
        body=f"Officer: {body.officer_name}. Reason: {body.note or 'No reason given.'}",
        village_id=rec.village_id,
        is_demo=False,
        timestamp=datetime.utcnow(),
    ))

    await db.commit()
    return {
        "success": True,
        "recommendation": _serialize(rec, village.name if village else ""),
    }


@router.post("/{rec_id}/reassess")
async def reassess_recommendation(
    rec_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Officer requests a fresh AI assessment. Re-runs all scoring from current DB state
    and resets the record back to 'pending' with updated AI fields.
    """
    rec = await db.get(HITLRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    inc_result = await db.execute(
        select(Incident).where(Incident.village_id == rec.village_id)
    )
    inc = inc_result.scalars().first()
    village = await db.get(Village, rec.village_id)

    if not inc or not village:
        raise HTTPException(status_code=404, detail="Active incident or village not found")

    fields = await _build_recommendation(inc, village, db)

    # Update all AI fields in place
    rec.ai_action = fields["ai_action"]
    rec.ai_reasoning = fields["ai_reasoning"]
    rec.priority_class = fields["priority_class"]
    rec.priority_score = fields["priority_score"]
    rec.recommended_resources = fields["recommended_resources"]
    rec.fog_score = fields["fog_score"]
    rec.confidence_score = fields["confidence_score"]
    rec.people_at_risk = fields["people_at_risk"]
    rec.disaster_types = fields["disaster_types"]
    rec.status = "pending"
    rec.officer_name = None
    rec.officer_note = None
    rec.decided_at = None
    rec.reassessment_count = (rec.reassessment_count or 0) + 1
    rec.updated_at = datetime.utcnow()

    db.add(ActivityLog(
        id=str(uuid.uuid4())[:8],
        event_type="hitl_reassess",
        severity="info",
        title=f"AI recommendation reassessed for {village.name}",
        body=f"Reassessment #{rec.reassessment_count}. New action: {rec.ai_action}",
        village_id=rec.village_id,
        is_demo=False,
        timestamp=datetime.utcnow(),
    ))

    await db.commit()
    return {
        "success": True,
        "recommendation": _serialize(rec, village.name),
    }


@router.get("/audit")
async def get_audit_trail(db: AsyncSession = Depends(get_db)):
    """
    Full audit trail — all HITL records ordered by updated_at desc.
    Includes counts for a summary banner.
    """
    result = await db.execute(
        select(HITLRecommendation).order_by(HITLRecommendation.updated_at.desc())
    )
    recs = result.scalars().all()

    village_ids = list({r.village_id for r in recs})
    villages_result = await db.execute(
        select(Village).where(Village.id.in_(village_ids))
    )
    village_map = {v.id: v.name for v in villages_result.scalars().all()}

    counts = {"pending": 0, "approved": 0, "rejected": 0, "reassessing": 0}
    for r in recs:
        counts[r.status] = counts.get(r.status, 0) + 1

    return {
        "counts": counts,
        "total": len(recs),
        "records": [_serialize(r, village_map.get(r.village_id, "")) for r in recs],
    }
