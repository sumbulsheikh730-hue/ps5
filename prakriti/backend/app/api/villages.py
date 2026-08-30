"""
Village and Incident API routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Village, Incident, Report, Contradiction, Resource
from datetime import datetime

router = APIRouter(prefix="/api/villages", tags=["villages"])


@router.get("")
async def list_villages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Village, Incident)
        .outerjoin(Incident, Village.id == Incident.village_id)
        .order_by(Incident.rescue_priority_score.desc().nullslast())
    )
    rows = result.all()

    villages = []
    seen = set()
    for v, inc in rows:
        if v.id in seen:
            continue
        seen.add(v.id)
        villages.append(_village_with_incident(v, inc))
    return villages


@router.get("/{village_id}")
async def get_village(village_id: str, db: AsyncSession = Depends(get_db)):
    v = await db.get(Village, village_id)
    if not v:
        raise HTTPException(status_code=404, detail="Village not found")

    result = await db.execute(
        select(Incident).where(Incident.village_id == village_id).order_by(Incident.updated_at.desc())
    )
    inc = result.scalars().first()

    reports_result = await db.execute(
        select(Report).where(Report.village_id == village_id).order_by(Report.timestamp.desc())
    )
    reports = reports_result.scalars().all()

    contradictions_result = await db.execute(
        select(Contradiction).where(Contradiction.village_id == village_id)
    )
    contradictions = contradictions_result.scalars().all()

    return {
        **_village_with_incident(v, inc),
        "reports": [_serialize_report(r) for r in reports],
        "contradictions": [_serialize_contradiction(c) for c in contradictions],
        "timeline": _build_timeline(reports, inc),
    }


@router.get("/{village_id}/why-first")
async def why_this_village_first(village_id: str, db: AsyncSession = Depends(get_db)):
    v = await db.get(Village, village_id)
    if not v:
        raise HTTPException(status_code=404, detail="Village not found")

    inc_result = await db.execute(
        select(Incident).where(Incident.village_id == village_id)
    )
    inc = inc_result.scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="No incident data")

    # Get ranking among all villages
    all_incidents = (await db.execute(
        select(Incident).where(Incident.is_active == True).order_by(Incident.rescue_priority_score.desc())
    )).scalars().all()
    rank = next((i + 1 for i, x in enumerate(all_incidents) if x.village_id == village_id), 99)

    return {
        "village_id": village_id,
        "village_name": v.name,
        "block": v.block,
        "priority_rank": rank,
        "priority_score": inc.rescue_priority_score,
        "priority_class": inc.rescue_priority_class,
        "explanation": inc.priority_explanation,
        "key_facts": {
            "people_at_risk": inc.people_at_risk,
            "people_stranded": inc.people_stranded,
            "medical_emergencies": inc.medical_emergencies,
            "disaster_types": inc.disaster_types,
            "severity": inc.severity,
            "confidence": inc.confidence_score,
            "fog": inc.information_fog_score,
            "accessibility": inc.accessibility_score,
            "assigned_resources": inc.assigned_resources,
        },
        "ai_statement": _generate_ai_statement(v, inc, rank),
    }


def _generate_ai_statement(v, inc, rank: int) -> str:
    dtypes = ", ".join(inc.disaster_types or ["unknown"]).title()
    return (
        f"Village {v.name} is ranked #{rank} because it combines {dtypes} "
        f"with {inc.people_at_risk:,} people at risk, "
        f"{'severely limited' if inc.accessibility_score < 30 else 'limited'} road access "
        f"(accessibility: {inc.accessibility_score:.0f}/100), "
        f"{'active medical emergencies, ' if inc.medical_emergencies > 0 else ''}"
        f"and {inc.confidence_score:.0f}% evidence confidence. "
        f"{'No rescue resource has been assigned yet.' if not inc.assigned_resources else f'{len(inc.assigned_resources)} resource(s) assigned.'}"
    )


def _village_with_incident(v, inc):
    result = {
        "id": v.id,
        "name": v.name,
        "block": v.block,
        "district": v.district,
        "lat": v.lat,
        "lon": v.lon,
        "population": v.population,
        "is_demo": v.is_demo,
    }
    if inc:
        result.update({
            "incident_id": inc.id,
            "disaster_types": inc.disaster_types or [],
            "severity": inc.severity,
            "severity_score": inc.severity_score,
            "people_at_risk": inc.people_at_risk,
            "people_stranded": inc.people_stranded,
            "vulnerable_population": inc.vulnerable_population,
            "medical_emergencies": inc.medical_emergencies,
            "confidence_score": inc.confidence_score,
            "information_fog_score": inc.information_fog_score,
            "accessibility_score": inc.accessibility_score,
            "rescue_priority_score": inc.rescue_priority_score,
            "rescue_priority_class": inc.rescue_priority_class,
            "road_accessible": inc.road_accessible,
            "has_communication": inc.has_communication,
            "assigned_resources": inc.assigned_resources or [],
            "priority_explanation": inc.priority_explanation or [],
            "last_report_time": inc.last_report_time.isoformat() if inc.last_report_time else None,
            "updated_at": inc.updated_at.isoformat() if inc.updated_at else None,
        })
    else:
        result.update({
            "incident_id": None,
            "disaster_types": [],
            "severity": "unknown",
            "people_at_risk": 0,
            "confidence_score": 0,
            "information_fog_score": 100,
            "accessibility_score": 50,
            "rescue_priority_score": 0,
            "rescue_priority_class": "P4",
            "road_accessible": True,
            "has_communication": True,
            "assigned_resources": [],
        })
    return result


def _serialize_report(r):
    return {
        "id": r.id,
        "source_type": r.source_type,
        "reporter_name": r.reporter_name,
        "disaster_types": r.disaster_types or [],
        "description": r.description,
        "severity": r.severity,
        "people_affected": r.people_affected,
        "urgency": r.urgency,
        "is_verified": r.is_verified,
        "reliability_score": r.reliability_score,
        "is_duplicate": r.is_duplicate,
        "timestamp": r.timestamp.isoformat() if r.timestamp else None,
    }


def _serialize_contradiction(c):
    return {
        "id": c.id,
        "contradiction_type": c.contradiction_type,
        "claim_a": c.claim_a,
        "claim_b": c.claim_b,
        "source_a": (c.report_a.source_type if c.report_a else None),
        "source_b": (c.report_b.source_type if c.report_b else None),
        "current_confidence": c.current_confidence,
        "suggested_action": c.suggested_action,
        "is_resolved": c.is_resolved,
        "detected_at": c.detected_at.isoformat() if c.detected_at else None,
    }


def _build_timeline(reports, inc) -> list:
    events = []
    for r in reports:
        events.append({
            "time": r.timestamp.isoformat() if r.timestamp else None,
            "event": f"{r.source_type.replace('_', ' ').title()} report received",
            "detail": (r.description or "")[:100],
            "severity": r.severity,
            "source": r.source_type,
        })

    events.sort(key=lambda x: x["time"] or "")
    return events
