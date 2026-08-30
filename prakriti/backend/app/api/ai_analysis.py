"""
AI Analysis API – damage assessment, before/after comparison
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.ai.damage_assessment import analyze_image, compare_before_after
from app.config import settings
from typing import Optional
import os
import uuid

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/assess-damage")
async def assess_damage(
    image: UploadFile = File(...),
    disaster_context: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if image.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files accepted")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(image.filename or "img.jpg")[1] or ".jpg"
    fname = f"assess_{uuid.uuid4()}{ext}"
    fpath = os.path.join(settings.UPLOAD_DIR, fname)

    content = await image.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    with open(fpath, "wb") as f:
        f.write(content)

    result = analyze_image(fpath, image.filename or fname, disaster_context)
    return result


@router.post("/compare-before-after")
async def compare_images(
    before: UploadFile = File(...),
    after: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    before_path = os.path.join(settings.UPLOAD_DIR, f"before_{uuid.uuid4()}.jpg")
    after_path = os.path.join(settings.UPLOAD_DIR, f"after_{uuid.uuid4()}.jpg")

    content_b = await before.read()
    content_a = await after.read()

    with open(before_path, "wb") as f:
        f.write(content_b)
    with open(after_path, "wb") as f:
        f.write(content_a)

    result = compare_before_after(before_path, after_path)
    return result
