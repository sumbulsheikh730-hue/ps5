"""
Simulation API routes
"""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, AsyncSessionLocal
from app.services.simulation import run_simulation, get_sim_state, sim_state

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.post("/start")
async def start_simulation(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    if sim_state.get("running"):
        return {"error": "Simulation already running", "step": sim_state.get("step", 0)}

    async def run_in_background():
        async with AsyncSessionLocal() as session:
            await run_simulation(session)

    background_tasks.add_task(run_in_background)
    return {"success": True, "message": "Simulation started. Poll /api/simulation/status for progress."}


@router.get("/status")
async def get_simulation_status():
    state = get_sim_state()
    return {
        "running": state.get("running", False),
        "step": state.get("step", 0),
        "total_steps": 12,
        "progress_pct": round((state.get("step", 0) / 12) * 100),
        "log": state.get("log", [])[-5:],
    }


@router.post("/reset")
async def reset_simulation(db: AsyncSession = Depends(get_db)):
    from app.services.seeder import reset_demo_data
    await reset_demo_data(db)
    return {"success": True, "message": "Demo data reset to initial state."}
