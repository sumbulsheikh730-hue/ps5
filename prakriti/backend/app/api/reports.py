"""
Reports API routes – submission, listing, contradiction detection
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Report, Village, Incident, Contradiction, ActivityLog
from app.ai import detect_contradictions, detect_duplicates, compute_evidence_confidence
from app.ai.scoring import SOURCE_WEIGHTS
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
import os
import uuid
from app.config import settings

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportCreate(BaseModel):
    village_id: str
    source_type: str = "citizen"
    reporter_name: str = "Anonymous"
    disaster_types: List[str] = []
    description: str
    severity: str = "unknown"
    people_affected: int = 0
    urgency: int = 3
    lat: Optional[float] = None
    lon: Optional[float] = None


@router.post("")
async def submit_report(
    village_id: str = Form(...),
    source_type: str = Form("citizen"),
    reporter_name: str = Form("Anonymous"),
    disaster_types: str = Form("[]"),
    description: str = Form(...),
    severity: str = Form("unknown"),
    people_affected: int = Form(0),
    urgency: int = Form(3),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    # Validate village
    village = await db.get(Village, village_id)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    # Parse disaster types
    try:
        dtypes = json.loads(disaster_types)
    except Exception:
        dtypes = [disaster_types] if disaster_types else []

    # Save image if uploaded
    image_path = None
    if image:
        allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if image.content_type not in allowed:
            raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(image.filename)[1]
        fname = f"{uuid.uuid4()}{ext}"
        fpath = os.path.join(settings.UPLOAD_DIR, fname)
        content = await image.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large")
        with open(fpath, "wb") as f:
            f.write(content)
        image_path = fpath

    # Reliability score
    base_weight = SOURCE_WEIGHTS.get(source_type, 0.3)
    reliability = round(base_weight * 100, 1)

    report = Report(
        id=str(uuid.uuid4())[:8],
        village_id=village_id,
        source_type=source_type,
        reporter_name=reporter_name,
        disaster_types=dtypes,
        description=description,
        severity=severity,
        people_affected=people_affected,
        urgency=urgency,
        lat=lat,
        lon=lon,
        image_path=image_path,
        reliability_score=reliability,
        is_verified=(source_type in ("official", "police", "satellite")),
        timestamp=datetime.utcnow(),
        is_demo=False,
    )
    db.add(report)
    await db.flush()

    # Run duplicate and contradiction detection
    existing_reports = (await db.execute(
        select(Report).where(Report.village_id == village_id)
    )).scalars().all()

    report_dicts = [
        {
            "id": r.id, "village_id": r.village_id, "source_type": r.source_type,
            "severity": r.severity, "description": r.description,
            "people_affected": r.people_affected, "is_verified": r.is_verified,
            "timestamp": r.timestamp, "disaster_types": r.disaster_types or [],
        }
        for r in existing_reports
    ]

    # Check duplicates
    report_dicts = detect_duplicates(report_dicts)
    for rd in report_dicts:
        if rd["id"] == report.id and rd.get("is_duplicate"):
            report.is_duplicate = True
            report.duplicate_of = rd.get("duplicate_of")

    # Check contradictions
    new_contradictions = detect_contradictions(report_dicts)
    for c in new_contradictions:
        existing = (await db.execute(
            select(Contradiction).where(
                Contradiction.report_a_id == c["report_a_id"],
                Contradiction.report_b_id == c["report_b_id"],
            )
        )).scalars().first()
        if not existing:
            db.add(Contradiction(
                id=str(uuid.uuid4())[:8],
                village_id=village_id,
                **c,
                is_demo=False,
            ))

    # Log activity
    db.add(ActivityLog(
        id=str(uuid.uuid4())[:8],
        event_type="report",
        severity="critical" if urgency >= 4 else "info",
        title=f"New {source_type.replace('_',' ')} report – {village.name}",
        body=description[:200],
        village_id=village_id,
        is_demo=False,
        timestamp=datetime.utcnow(),
    ))

    await db.commit()

    return {
        "success": True,
        "report_id": report.id,
        "is_duplicate": report.is_duplicate,
        "reliability_score": reliability,
        "contradictions_found": len(new_contradictions),
        "message": f"Report submitted. {'Possible duplicate detected.' if report.is_duplicate else ''} {len(new_contradictions)} contradiction(s) flagged.",
    }


@router.get("")
async def list_reports(village_id: Optional[str] = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(Report).order_by(Report.timestamp.desc()).limit(limit)
    if village_id:
        q = q.where(Report.village_id == village_id)
    result = await db.execute(q)
    reports = result.scalars().all()
    return [
        {
            "id": r.id,
            "village_id": r.village_id,
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
        for r in reports
    ]


@router.get("/contradictions")
async def list_contradictions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Contradiction).where(Contradiction.is_resolved == False).order_by(Contradiction.detected_at.desc())
    )
    contradictions = result.scalars().all()
    return [
        {
            "id": c.id,
            "village_id": c.village_id,
            "contradiction_type": c.contradiction_type,
            "claim_a": c.claim_a,
            "claim_b": c.claim_b,
            "current_confidence": c.current_confidence,
            "suggested_action": c.suggested_action,
            "is_resolved": c.is_resolved,
            "detected_at": c.detected_at.isoformat() if c.detected_at else None,
        }
        for c in contradictions
    ]
