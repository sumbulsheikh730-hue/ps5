"""Reports API endpoints"""

import os
import uuid
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models.report import Report
from app.models.village import Village
from app.ai.scoring import (
    compute_report_reliability, compute_evidence_confidence,
    compute_information_fog, detect_contradictions
)
from app.ai.damage_assessment import analyze_image_demo
import aiofiles

router = APIRouter()

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20")) * 1024 * 1024
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}


def report_to_dict(r: Report) -> dict:
    return {
        "id": r.id,
        "village_id": r.village_id,
        "village_name": r.village_name,
        "reporter_name": r.reporter_name,
        "source_type": r.source_type,
        "disaster_type": r.disaster_type,
        "description": r.description,
        "urgency": r.urgency,
        "affected_count": r.affected_count,
        "lat": r.lat,
        "lng": r.lng,
        "location_text": r.location_text,
        "reliability_score": r.reliability_score,
        "duplicate_probability": r.duplicate_probability,
        "is_duplicate": r.is_duplicate,
        "contradiction_flag": r.contradiction_flag,
        "contradiction_detail": r.contradiction_detail or {},
        "is_verified": r.is_verified,
        "verified_by": r.verified_by,
        "image_path": r.image_path,
        "ai_damage_result": r.ai_damage_result or {},
        "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        "is_simulation": r.is_simulation,
    }


@router.get("/")
async def list_reports(
    village_id: Optional[int] = Query(None),
    source_type: Optional[str] = Query(None),
    is_verified: Optional[bool] = Query(None),
    is_duplicate: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    q = select(Report).order_by(Report.timestamp.desc())
    result = await db.execute(q)
    reports = result.scalars().all()
    out = [report_to_dict(r) for r in reports]
    if village_id is not None:
        out = [r for r in out if r["village_id"] == village_id]
    if source_type:
        out = [r for r in out if r["source_type"] == source_type]
    if is_verified is not None:
        out = [r for r in out if r["is_verified"] == is_verified]
    if is_duplicate is not None:
        out = [r for r in out if r["is_duplicate"] == is_duplicate]
    return out


@router.get("/contradictions")
async def get_contradictions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Report).where(Report.contradiction_flag == True)
    )
    reports = result.scalars().all()

    # Group by village
    by_village = {}
    for r in reports:
        key = r.village_name
        by_village.setdefault(key, []).append(report_to_dict(r))

    contradictions = []
    for village_name, reps in by_village.items():
        if len(reps) >= 2:
            for i in range(len(reps)):
                for j in range(i+1, len(reps)):
                    contradictions.append({
                        "village_name": village_name,
                        "report_a": reps[i],
                        "report_b": reps[j],
                        "action": "Satellite/ground verification recommended",
                    })
        else:
            contradictions.append({
                "village_name": village_name,
                "report_a": reps[0],
                "report_b": None,
                "action": "Additional verification recommended",
            })

    return {"count": len(contradictions), "contradictions": contradictions}


@router.post("/submit")
async def submit_report(
    village_name: str = Form(...),
    source_type: str = Form(...),
    disaster_type: str = Form(...),
    description: str = Form(...),
    urgency: str = Form("moderate"),
    affected_count: int = Form(0),
    reporter_name: str = Form("Anonymous"),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    location_text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    # Validate inputs
    valid_sources = {"citizen", "official", "police", "social_media", "satellite", "sensor", "ngo"}
    if source_type not in valid_sources:
        raise HTTPException(status_code=400, detail=f"Invalid source_type. Must be one of {valid_sources}")

    valid_urgencies = {"critical", "high", "moderate", "low"}
    if urgency not in valid_urgencies:
        raise HTTPException(status_code=400, detail="Invalid urgency")

    if len(description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Description too short")

    # Find village
    vr = await db.execute(
        select(Village).where(Village.name.ilike(f"%{village_name}%"))
    )
    village = vr.scalar_one_or_none()
    village_id = village.id if village else None

    # Handle image upload
    image_path = None
    ai_damage_result = {}

    if image:
        ext = os.path.splitext(image.filename or "")[1].lower()
        if ext not in ALLOWED_EXT:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Use: {ALLOWED_EXT}")
        content = await image.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File too large")
        fname = f"{uuid.uuid4().hex}{ext}"
        fpath = os.path.join("uploads", fname)
        async with aiofiles.open(fpath, "wb") as f:
            await f.write(content)
        image_path = f"/uploads/{fname}"
        # Run demo AI analysis
        ai_damage_result = analyze_image_demo(content, fname)

    report_data = {
        "source_type": source_type,
        "timestamp": datetime.now(timezone.utc),
    }

    # Compute reliability
    reliability = compute_report_reliability(report_data)

    # Check for duplicates (simple: same village + same disaster type + recent)
    recent = await db.execute(
        select(Report)
        .where(Report.village_id == village_id)
        .where(Report.disaster_type == disaster_type)
        .where(Report.source_type == source_type)
    )
    similar = recent.scalars().all()
    dup_prob = min(80.0, len(similar) * 25.0) if similar else 0.0

    r = Report(
        village_id=village_id,
        village_name=village_name,
        reporter_name=reporter_name,
        source_type=source_type,
        disaster_type=disaster_type,
        description=description,
        urgency=urgency,
        affected_count=affected_count,
        lat=lat,
        lng=lng,
        location_text=location_text,
        reliability_score=reliability,
        duplicate_probability=dup_prob,
        is_duplicate=dup_prob > 60,
        image_path=image_path,
        ai_damage_result=ai_damage_result,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(r)
    await db.flush()

    # Update village scores if found
    if village:
        await _update_village_scores(db, village)

    await db.commit()
    await db.refresh(r)

    return {
        "status": "submitted",
        "report_id": r.id,
        "reliability_score": r.reliability_score,
        "duplicate_probability": r.duplicate_probability,
        "is_duplicate": r.is_duplicate,
        "ai_damage_result": ai_damage_result,
    }


@router.get("/{report_id}")
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return report_to_dict(r)


@router.post("/{report_id}/verify")
async def verify_report(report_id: int, verified_by: str = "admin", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    r.is_verified = True
    r.verified_by = verified_by
    await db.commit()
    return {"status": "verified", "report_id": report_id}


async def _update_village_scores(db: AsyncSession, village: Village):
    """Recalculate village scores after new report."""
    from app.models.report import Report
    rr = await db.execute(select(Report).where(Report.village_id == village.id))
    reports = [r.__dict__ for r in rr.scalars().all()]

    vd = {"communication_gap_hours": village.communication_gap_hours,
          "communication_active": village.communication_active,
          "confidence_score": village.confidence_score,
          "severity": village.severity,
          "affected_population": village.affected_population,
          "accessibility_score": village.accessibility_score,
          "medical_emergencies": village.medical_emergencies,
          "assigned_resources": village.assigned_resources or []}

    evidence = compute_evidence_confidence(reports)
    village.confidence_score = evidence["score"]
    village.report_count = len(reports)
    village.verified_report_count = sum(1 for r in reports if r.get("is_verified"))
    village.contradiction_count = sum(1 for r in reports if r.get("contradiction_flag"))
