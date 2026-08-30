"""
Dashboard API routes
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Village, Incident, Report, Resource, Road, ActivityLog, Contradiction
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    total_villages = (await db.execute(select(func.count(Village.id)))).scalar()
    incidents = (await db.execute(select(Incident).where(Incident.is_active == True))).scalars().all()

    critical_zones = sum(1 for i in incidents if i.severity in ("critical", "high"))
    people_at_risk = sum(i.people_at_risk for i in incidents)
    active_incidents = len(incidents)

    reports = (await db.execute(select(Report))).scalars().all()
    verified_reports = sum(1 for r in reports if r.is_verified)
    unverified_reports = sum(1 for r in reports if not r.is_verified)

    resources = (await db.execute(select(Resource))).scalars().all()
    available_resources = sum(1 for r in resources if r.status == "available")
    deployed_resources = sum(1 for r in resources if r.status == "deployed")

    roads = (await db.execute(select(Road))).scalars().all()
    blocked_roads = sum(1 for r in roads if r.status in ("blocked", "flooded"))

    contradictions = (await db.execute(select(func.count(Contradiction.id)))).scalar()

    # Blackout villages (no communication)
    blackout_villages = sum(1 for i in incidents if not i.has_communication)

    return {
        "total_villages": total_villages,
        "affected_villages": active_incidents,
        "critical_zones": critical_zones,
        "people_at_risk": people_at_risk,
        "active_incidents": active_incidents,
        "verified_reports": verified_reports,
        "unverified_reports": unverified_reports,
        "total_reports": len(reports),
        "blocked_roads": blocked_roads,
        "available_resources": available_resources,
        "deployed_resources": deployed_resources,
        "total_resources": len(resources),
        "contradictions_detected": contradictions,
        "blackout_villages": blackout_villages,
        "last_updated": datetime.utcnow().isoformat(),
        "scenario": "Suvarnapur District – Flood + Landslide Event (DEMO)",
    }


@router.get("/activity")
async def get_activity_feed(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "event_type": log.event_type,
            "severity": log.severity,
            "title": log.title,
            "body": log.body,
            "village_id": log.village_id,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]


@router.get("/alerts")
async def get_alerts(db: AsyncSession = Depends(get_db)):
    incidents = (await db.execute(
        select(Incident, Village)
        .join(Village, Incident.village_id == Village.id)
        .where(Incident.is_active == True)
    )).all()

    alerts = []
    for inc, vil in incidents:
        if inc.severity == "critical":
            alerts.append({
                "type": "critical_zone",
                "severity": "critical",
                "village": vil.name,
                "message": f"Critical zone: {vil.name} – {', '.join(inc.disaster_types or [])}",
                "village_id": vil.id,
            })
        if not inc.has_communication:
            alerts.append({
                "type": "communication_blackout",
                "severity": "warning",
                "village": vil.name,
                "message": f"Communication blackout: {vil.name} – no recent contact",
                "village_id": vil.id,
            })
        if inc.medical_emergencies > 0:
            alerts.append({
                "type": "medical_emergency",
                "severity": "critical",
                "village": vil.name,
                "message": f"Medical emergency: {vil.name} – {inc.medical_emergencies} report(s)",
                "village_id": vil.id,
            })
        if inc.information_fog_score > 70:
            alerts.append({
                "type": "high_fog",
                "severity": "warning",
                "village": vil.name,
                "message": f"High information uncertainty: {vil.name} (fog: {inc.information_fog_score:.0f}%)",
                "village_id": vil.id,
            })

    contradictions = (await db.execute(
        select(Contradiction).where(Contradiction.is_resolved == False)
    )).scalars().all()
    for c in contradictions:
        alerts.append({
            "type": "contradiction",
            "severity": "warning",
            "village": c.village_id,
            "message": f"Contradiction detected at village {c.village_id}: {c.contradiction_type}",
            "village_id": c.village_id,
        })

    # Resource shortage
    resources = (await db.execute(select(Resource))).scalars().all()
    boat_available = sum(1 for r in resources if r.resource_type == "boat" and r.status == "available")
    if boat_available < 2:
        alerts.append({
            "type": "resource_shortage",
            "severity": "warning",
            "village": None,
            "message": f"Resource shortage: Only {boat_available} rescue boat(s) available",
            "village_id": None,
        })

    return alerts[:30]


@router.get("/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    incidents = (await db.execute(
        select(Incident, Village).join(Village, Incident.village_id == Village.id).where(Incident.is_active == True)
    )).all()

    # Severity distribution
    severity_dist = {"critical": 0, "high": 0, "moderate": 0, "low": 0, "unknown": 0}
    disaster_type_counts = {}
    population_by_block = {}
    fog_scores = []
    priority_dist = {"P1": 0, "P2": 0, "P3": 0, "P4": 0}

    for inc, vil in incidents:
        severity_dist[inc.severity] = severity_dist.get(inc.severity, 0) + 1
        for dt in (inc.disaster_types or []):
            disaster_type_counts[dt] = disaster_type_counts.get(dt, 0) + 1
        block = vil.block
        population_by_block[block] = population_by_block.get(block, 0) + inc.people_at_risk
        fog_scores.append({"village": vil.name, "fog": inc.information_fog_score})
        priority_dist[inc.rescue_priority_class] = priority_dist.get(inc.rescue_priority_class, 0) + 1

    reports = (await db.execute(select(Report))).scalars().all()
    source_counts = {}
    for r in reports:
        source_counts[r.source_type] = source_counts.get(r.source_type, 0) + 1

    return {
        "severity_distribution": severity_dist,
        "disaster_type_distribution": disaster_type_counts,
        "population_at_risk_by_block": population_by_block,
        "information_fog_scores": sorted(fog_scores, key=lambda x: -x["fog"])[:10],
        "priority_distribution": priority_dist,
        "report_source_distribution": source_counts,
        "verified_vs_unverified": {
            "verified": sum(1 for r in reports if r.is_verified),
            "unverified": sum(1 for r in reports if not r.is_verified),
        },
    }
