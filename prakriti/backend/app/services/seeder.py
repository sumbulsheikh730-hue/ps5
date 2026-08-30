"""
Seeder service: loads demo data into the database on first run.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models import Village, Report, Incident, Contradiction, Resource, Road, ActivityLog, SimulationState
from app.ai import (
    compute_evidence_confidence, compute_information_fog,
    compute_accessibility_score, compute_rescue_priority,
    detect_contradictions, detect_duplicates,
)
from data.demo_data import VILLAGES, REPORTS, RESOURCES, ROADS, CONTRADICTIONS
from datetime import datetime
import os


def _to_datetime(val):
    if isinstance(val, datetime):
        return val
    return datetime.utcnow()


async def seed_demo_data(db: AsyncSession, force: bool = False):
    """Seed all demo data. If force=True, clears existing demo data first."""

    # Check if already seeded
    existing = await db.execute(select(Village).where(Village.is_demo == True).limit(1))
    if existing.scalars().first() and not force:
        return  # Already seeded

    if force:
        await db.execute(delete(ActivityLog).where(ActivityLog.is_demo == True))
        await db.execute(delete(Contradiction).where(Contradiction.is_demo == True))
        await db.execute(delete(Incident).where(Incident.is_demo == True))
        await db.execute(delete(Report).where(Report.is_demo == True))
        await db.execute(delete(Resource).where(Resource.is_demo == True))
        await db.execute(delete(Road).where(Road.is_demo == True))
        await db.execute(delete(Village).where(Village.is_demo == True))
        await db.execute(delete(SimulationState))
        await db.commit()

    # Insert villages
    for v in VILLAGES:
        db.add(Village(**v, is_demo=True))
    await db.flush()

    # Insert reports with timestamps as datetime
    report_dicts = []
    for r in REPORTS:
        rd = {k: v for k, v in r.items()}
        rd["timestamp"] = _to_datetime(rd.get("timestamp"))
        rd["is_demo"] = True
        if "reliability_score" not in rd:
            from app.ai.scoring import SOURCE_WEIGHTS
            base = SOURCE_WEIGHTS.get(rd.get("source_type", "unknown"), 0.3)
            rd["reliability_score"] = round(base * 100, 1)
        db.add(Report(**rd))
        report_dicts.append(rd)

    await db.flush()

    # Insert resources
    for r in RESOURCES:
        db.add(Resource(**r, is_demo=True, current_lat=r["base_lat"], current_lon=r["base_lon"]))

    # Insert roads
    for r in ROADS:
        db.add(Road(**r, is_demo=True))

    await db.flush()

    # Build incidents per village
    for v in VILLAGES:
        v_reports = [r for r in report_dicts if r.get("village_id") == v["id"]]
        v_roads = [r for r in ROADS if r.get("from_village_id") == v["id"] or r.get("to_village_id") == v["id"]]
        v_contradictions_raw = [c for c in CONTRADICTIONS if c.get("village_id") == v["id"]]

        # Compute scores
        evidence = compute_evidence_confidence(v_reports, v)
        fog = compute_information_fog(v_reports, v, v_contradictions_raw)
        accessibility = compute_accessibility_score(v, v_roads)

        # Determine aggregate severity
        if v_reports:
            sev_counts = {}
            for r in v_reports:
                s = r.get("severity", "unknown")
                sev_counts[s] = sev_counts.get(s, 0) + 1
            severity = max(sev_counts, key=sev_counts.get)
        else:
            severity = "unknown"

        all_dtypes = []
        for r in v_reports:
            all_dtypes.extend(r.get("disaster_types", []))
        disaster_types = list(set(all_dtypes))

        people_at_risk = max((r.get("people_affected", 0) for r in v_reports), default=0)
        if not people_at_risk:
            people_at_risk = int(v.get("population", 500) * 0.4)

        stranded = int(people_at_risk * 0.3)
        vulnerable = int(people_at_risk * 0.2)
        medical_emerg = 1 if any("medical" in (r.get("description") or "").lower() or "missing" in (r.get("description") or "").lower() for r in v_reports) else 0
        if "kendupalli" in v["name"].lower() or "krishnanagar" in v["name"].lower():
            medical_emerg = max(1, medical_emerg)

        has_comm = len(v_reports) > 0 and any(
            (datetime.utcnow() - _to_datetime(r.get("timestamp"))).total_seconds() < 3600 * 8
            for r in v_reports
        )

        incident_dict = {
            "village_id": v["id"],
            "disaster_types": disaster_types,
            "severity": severity,
            "people_at_risk": people_at_risk,
            "people_stranded": stranded,
            "vulnerable_population": vulnerable,
            "medical_emergencies": medical_emerg,
            "confidence_score": evidence["score"],
            "information_fog_score": fog["score"],
            "accessibility_score": accessibility["score"],
            "road_accessible": accessibility["road_accessible"],
            "has_communication": has_comm,
            "last_report_time": max((_to_datetime(r.get("timestamp")) for r in v_reports), default=None) if v_reports else None,
            "assigned_resources": [],
            "evidence_breakdown": evidence["breakdown"],
            "fog_factors": fog["factors"],
            "is_active": True,
            "is_demo": True,
        }

        priority = compute_rescue_priority(
            v,
            incident_dict,
            evidence["score"],
            accessibility["score"],
            fog["score"],
        )

        incident_dict["rescue_priority_score"] = priority["score"]
        incident_dict["rescue_priority_class"] = priority["class"]
        incident_dict["priority_explanation"] = priority["explanation"]
        from app.ai.scoring import SEVERITY_SCORES
        incident_dict["severity_score"] = SEVERITY_SCORES.get(severity, 0.1) * 100

        db.add(Incident(**incident_dict))

    await db.flush()

    # Insert pre-defined contradictions
    for c in CONTRADICTIONS:
        db.add(Contradiction(**c, is_demo=True))

    # Insert initial activity log
    logs = [
        ActivityLog(event_type="system", severity="info", title="PRAKRITI EOC System Initialized", body="Demo scenario loaded. Suvarnapur district flood + landslide event.", is_demo=True, timestamp=datetime.utcnow()),
        ActivityLog(event_type="report", severity="critical", title="Critical flood report – Rampur", body="800 people reported trapped. Police confirmation received.", village_id="VLG001", is_demo=True),
        ActivityLog(event_type="contradiction", severity="warning", title="Contradiction detected – Rampur", body="Police report conflicts with citizen claim of 'minor waterlogging'.", village_id="VLG001", is_demo=True),
        ActivityLog(event_type="satellite", severity="info", title="Satellite evidence confirmed – Rampur", body="ISRO SAR analysis confirms 72% inundation. Priority upgraded to CRITICAL.", village_id="VLG001", is_demo=True),
        ActivityLog(event_type="report", severity="critical", title="School building collapse – Krishnanagar", body="8 children missing. Official confirmation received.", village_id="VLG004", is_demo=True),
        ActivityLog(event_type="blackout", severity="warning", title="Communication blackout – Shilapur", body="No reports received from Shilapur. Last known contact: prior to event.", village_id="VLG015", is_demo=True),
        ActivityLog(event_type="report", severity="high", title="Landslide blocks road – Jhillimili", body="VR-11 completely blocked. 3 houses buried. 20+ reported missing.", village_id="VLG010", is_demo=True),
        ActivityLog(event_type="medical", severity="critical", title="Health center flooded – Kendupalli", body="6 critical patients without medication. Medical team deployment recommended.", village_id="VLG012", is_demo=True),
    ]
    for log in logs:
        db.add(log)

    # Init simulation state
    sim = SimulationState(id=1, is_running=False, step=0, total_steps=12)
    db.add(sim)

    await db.commit()


async def reset_demo_data(db: AsyncSession):
    """Re-seed demo data from scratch."""
    await seed_demo_data(db, force=True)
