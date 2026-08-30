"""Villages API endpoints"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models.village import Village
from app.models.report import Report
from app.ai.scoring import (
    compute_rescue_priority, compute_evidence_confidence,
    compute_information_fog, compute_accessibility_score, detect_contradictions
)
import json

router = APIRouter()


def village_to_dict(v: Village) -> dict:
    return {
        "id": v.id,
        "name": v.name,
        "block": v.block,
        "district": v.district,
        "lat": v.lat,
        "lng": v.lng,
        "disaster_types": v.disaster_types or [],
        "severity": v.severity,
        "severity_score": v.severity_score,
        "total_population": v.total_population,
        "affected_population": v.affected_population,
        "stranded_population": v.stranded_population,
        "vulnerable_population": v.vulnerable_population,
        "medical_emergencies": v.medical_emergencies,
        "rescue_priority_score": v.rescue_priority_score,
        "priority_class": v.priority_class,
        "confidence_score": v.confidence_score,
        "information_fog_score": v.information_fog_score,
        "accessibility_score": v.accessibility_score,
        "is_accessible": v.is_accessible,
        "communication_active": v.communication_active,
        "last_report_time": v.last_report_time.isoformat() if v.last_report_time else None,
        "communication_gap_hours": v.communication_gap_hours,
        "report_count": v.report_count,
        "verified_report_count": v.verified_report_count,
        "contradiction_count": v.contradiction_count,
        "priority_reasons": v.priority_reasons or [],
        "evidence_breakdown": v.evidence_breakdown or {},
        "assigned_resources": v.assigned_resources or [],
        "timeline": v.timeline or [],
        "is_simulation": v.is_simulation,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "updated_at": v.updated_at.isoformat() if v.updated_at else None,
    }


@router.get("/")
async def list_villages(
    severity: Optional[str] = Query(None),
    block: Optional[str] = Query(None),
    priority_class: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    q = select(Village)
    result = await db.execute(q)
    villages = result.scalars().all()
    out = [village_to_dict(v) for v in villages]
    if severity:
        out = [v for v in out if v["severity"] == severity]
    if block:
        out = [v for v in out if v["block"] == block]
    if priority_class:
        out = [v for v in out if v["priority_class"] == priority_class]
    out.sort(key=lambda v: v["rescue_priority_score"], reverse=True)
    return out


@router.get("/summary")
async def dashboard_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Village))
    villages = result.scalars().all()

    total_affected = sum(v.affected_population for v in villages)
    critical = sum(1 for v in villages if v.severity == "critical")
    high = sum(1 for v in villages if v.severity == "high")

    from app.models.report import Report
    rr = await db.execute(select(Report))
    reports = rr.scalars().all()
    verified = sum(1 for r in reports if r.is_verified)
    unverified = sum(1 for r in reports if not r.is_verified)
    duplicates = sum(1 for r in reports if r.is_duplicate)
    contradictions = sum(1 for r in reports if r.contradiction_flag)

    from app.models.road import Road
    roads_r = await db.execute(select(Road))
    roads = roads_r.scalars().all()
    blocked_roads = sum(1 for r in roads if r.status in ("blocked", "flooded", "damaged"))

    from app.models.resource import Resource
    res_r = await db.execute(select(Resource))
    resources = res_r.scalars().all()
    available_res = sum(1 for r in resources if r.status == "available")
    deployed_res = sum(1 for r in resources if r.status == "deployed")

    blackout_villages = [v.name for v in villages if not v.communication_active]

    return {
        "total_villages": len(villages),
        "critical_zones": critical,
        "high_zones": high,
        "total_affected_population": total_affected,
        "active_incidents": critical + high,
        "verified_reports": verified,
        "unverified_reports": unverified,
        "duplicate_reports": duplicates,
        "contradiction_reports": contradictions,
        "total_reports": len(reports),
        "blocked_roads": blocked_roads,
        "available_resources": available_res,
        "deployed_resources": deployed_res,
        "blackout_villages": blackout_villages,
        "p1_count": sum(1 for v in villages if v.priority_class == "P1"),
        "p2_count": sum(1 for v in villages if v.priority_class == "P2"),
        "p3_count": sum(1 for v in villages if v.priority_class == "P3"),
        "p4_count": sum(1 for v in villages if v.priority_class == "P4"),
    }


@router.get("/{village_id}")
async def get_village(village_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Village).where(Village.id == village_id))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Village not found")
    return village_to_dict(v)


@router.get("/{village_id}/why-first")
async def why_first(village_id: int, db: AsyncSession = Depends(get_db)):
    """Explainable AI – why is this village ranked first?"""
    result = await db.execute(select(Village).where(Village.id == village_id))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Village not found")

    reports_r = await db.execute(
        select(Report).where(Report.village_id == village_id)
    )
    reports = [r.__dict__ for r in reports_r.scalars().all()]

    vd = village_to_dict(v)
    priority_result = compute_rescue_priority(vd, reports)
    evidence_result = compute_evidence_confidence(reports)
    fog_result = compute_information_fog(vd, reports)

    # Find ranking
    all_r = await db.execute(select(Village))
    all_villages = all_r.scalars().all()
    sorted_v = sorted(all_villages, key=lambda x: x.rescue_priority_score, reverse=True)
    rank = next((i+1 for i, sv in enumerate(sorted_v) if sv.id == village_id), 0)

    return {
        "village": vd,
        "rank": rank,
        "priority": priority_result,
        "evidence": evidence_result,
        "fog": fog_result,
        "explanation": _build_explanation(v, priority_result, evidence_result, fog_result, rank),
    }


def _build_explanation(v: Village, priority: dict, evidence: dict, fog: dict, rank: int) -> str:
    reasons = priority.get("reasons", [])
    reasons_text = "\n".join(f"  {i+1}. {r}" for i, r in enumerate(reasons))
    return (
        f'Village "{v.name}" has been ranked #{rank} because:\n'
        f'{reasons_text}\n\n'
        f'Evidence confidence: {evidence.get("score", 0):.0f}%\n'
        f'Information fog: {fog.get("score", 0):.0f}% ({fog.get("status", "")})\n'
        f'Priority score: {v.rescue_priority_score:.0f}/100\n'
        f'Classification: {v.priority_class} – '
        + {"P1": "Immediate Rescue Required", "P2": "Urgent", "P3": "Required", "P4": "Monitor"}.get(v.priority_class, "")
    )
