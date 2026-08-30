"""Routes / Road Network API endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database import get_db
from app.models.road import Road

router = APIRouter()


def road_to_dict(r: Road) -> dict:
    return {
        "id": r.id,
        "code": r.code,
        "name": r.name,
        "road_type": r.road_type,
        "from_location": r.from_location,
        "to_location": r.to_location,
        "from_lat": r.from_lat,
        "from_lng": r.from_lng,
        "to_lat": r.to_lat,
        "to_lng": r.to_lng,
        "waypoints": r.waypoints or [],
        "status": r.status,
        "block_reason": r.block_reason,
        "risk_level": r.risk_level,
        "distance_km": r.distance_km,
        "estimated_time_min": r.estimated_time_min,
        "suitable_for": r.suitable_for or [],
        "is_simulation": r.is_simulation,
    }


@router.get("/")
async def list_roads(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Road))
    roads = result.scalars().all()
    out = [road_to_dict(r) for r in roads]
    if status:
        out = [r for r in out if r["status"] == status]
    return out


@router.get("/recommended")
async def get_recommended_routes(
    vehicle_type: str = Query("ambulance"),
    to_village: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Return recommended routes for a given vehicle type."""
    result = await db.execute(select(Road))
    roads = result.scalars().all()

    suitable = [
        road_to_dict(r) for r in roads
        if vehicle_type in (r.suitable_for or []) and r.status in ("open", "caution")
    ]

    if to_village:
        filtered = [r for r in suitable if to_village.lower() in r["to_location"].lower()]
        if filtered:
            suitable = filtered

    # Sort: open first, then caution; by distance
    suitable.sort(key=lambda r: (0 if r["status"] == "open" else 1, r["distance_km"]))

    return {
        "vehicle_type": vehicle_type,
        "to_village": to_village,
        "recommended_routes": suitable[:5],
        "blocked_routes": [
            road_to_dict(r) for r in roads
            if r.status in ("blocked", "flooded", "damaged")
        ],
    }
