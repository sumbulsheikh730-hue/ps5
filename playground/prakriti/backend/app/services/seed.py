"""Database seeding service"""

from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.models.village import Village
from app.models.report import Report
from app.models.resource import Resource
from app.models.road import Road
from app.models.alert import Alert
from app.services.demo_data import (
    DEMO_VILLAGES, DEMO_REPORTS, DEMO_RESOURCES, DEMO_ROADS, DEMO_ALERTS
)
from datetime import datetime, timezone


async def seed_demo_data():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(text("SELECT COUNT(*) FROM villages"))
        count = result.scalar()
        if count and count > 0:
            return

        village_map = {}

        # Seed villages
        for vd in DEMO_VILLAGES:
            v = Village(**{k: v for k, v in vd.items() if hasattr(Village, k)})
            db.add(v)
        await db.flush()

        # Build name→id map
        result = await db.execute(text("SELECT id, name FROM villages"))
        for row in result:
            village_map[row[1]] = row[0]

        # Seed reports
        for rd in DEMO_REPORTS:
            village_id = village_map.get(rd.get("village_name"))
            r = Report(
                village_id=village_id,
                village_name=rd.get("village_name", ""),
                reporter_name=rd.get("reporter_name", "Anonymous"),
                source_type=rd.get("source_type", "citizen"),
                disaster_type=rd.get("disaster_type", "flood"),
                description=rd.get("description", ""),
                urgency=rd.get("urgency", "moderate"),
                affected_count=rd.get("affected_count", 0),
                reliability_score=rd.get("reliability_score", 50.0),
                duplicate_probability=rd.get("duplicate_probability", 0.0),
                is_duplicate=rd.get("is_duplicate", False),
                contradiction_flag=rd.get("contradiction_flag", False),
                contradiction_detail=rd.get("contradiction_detail", {}),
                is_verified=rd.get("is_verified", False),
                timestamp=_parse_ts(rd.get("timestamp")),
            )
            db.add(r)

        # Seed resources
        for res in DEMO_RESOURCES:
            r = Resource(
                code=res["code"],
                name=res["name"],
                resource_type=res["resource_type"],
                capacity=res.get("capacity", 1),
                status=res.get("status", "available"),
                lat=res.get("lat"),
                lng=res.get("lng"),
                base_location=res.get("base_location"),
                assigned_village_name=res.get("assigned_village_name"),
                assignment_reason=res.get("assignment_reason"),
                assigned_at=datetime.now(timezone.utc) if res.get("assigned_village_name") else None,
            )
            db.add(r)

        # Seed roads
        for road in DEMO_ROADS:
            ro = Road(**{k: v for k, v in road.items() if hasattr(Road, k)})
            db.add(ro)

        # Seed alerts
        for al in DEMO_ALERTS:
            village_id = village_map.get(al.get("village_name"))
            a = Alert(
                alert_type=al["alert_type"],
                severity=al["severity"],
                title=al["title"],
                message=al["message"],
                village_id=village_id,
                village_name=al.get("village_name"),
            )
            db.add(a)

        await db.commit()


def _parse_ts(ts):
    if not ts:
        return datetime.now(timezone.utc)
    if isinstance(ts, datetime):
        return ts
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)
