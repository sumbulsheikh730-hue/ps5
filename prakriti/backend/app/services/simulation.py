"""
Disaster Simulation Engine - PRAKRITI
Runs a progressive multi-step simulation for hackathon demo.
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models import (
    Village, Report, Incident, Contradiction, Resource,
    Road, ActivityLog, SimulationState
)
from app.ai import (
    compute_evidence_confidence, compute_information_fog,
    compute_accessibility_score, compute_rescue_priority,
    detect_contradictions,
)
from app.ai.scoring import SEVERITY_SCORES
import uuid
import random

SIMULATION_STEPS = [
    {"step": 1, "name": "Initial citizen reports arriving", "delay": 1.5},
    {"step": 2, "name": "More reports flooding in – contradictions emerging", "delay": 1.5},
    {"step": 3, "name": "Police & official confirmations received", "delay": 1.5},
    {"step": 4, "name": "Duplicate reports detected & filtered", "delay": 1.0},
    {"step": 5, "name": "Contradiction analysis running...", "delay": 1.5},
    {"step": 6, "name": "Satellite imagery received – evidence fusion", "delay": 2.0},
    {"step": 7, "name": "AI damage assessment processing...", "delay": 2.0},
    {"step": 8, "name": "Information Fog scores calculated", "delay": 1.0},
    {"step": 9, "name": "Population at risk estimated", "delay": 1.0},
    {"step": 10, "name": "Rescue priority ranking computed", "delay": 1.0},
    {"step": 11, "name": "Resource allocation engine running...", "delay": 1.5},
    {"step": 12, "name": "Route intelligence updated – EOC ready", "delay": 1.0},
]

sim_state = {"running": False, "step": 0, "log": []}


async def run_simulation(db: AsyncSession):
    global sim_state
    if sim_state["running"]:
        return {"error": "Simulation already running"}

    sim_state = {"running": True, "step": 0, "log": []}

    # Reset demo data
    from app.services.seeder import reset_demo_data
    await reset_demo_data(db)

    sim_state["step"] = 1
    sim_state["log"].append("Simulation started: Suvarnapur District Event")

    # Step 1-2: Citizen reports
    await _log_activity(db, "simulation", "info", "🔴 SIMULATION STARTED – Suvarnapur multi-hazard event",
                         "Flood + Landslide + Building Collapse scenario. Reports beginning to arrive.")
    sim_state["step"] = 2
    sim_state["log"].append("Step 2: Reports arriving")
    await _log_activity(db, "report", "critical", "Multiple citizen reports arriving – Rampur, Krishnanagar, Jhillimili",
                         "Flood, building collapse and landslide reports flooding the EOC.")

    # Step 3: Official confirmations
    sim_state["step"] = 3
    await _log_activity(db, "report", "high", "Official confirmations received from Police and Tehsildar",
                         "SI Rajesh Kumar (Rampur) and Tehsildar (Krishnanagar) filed verified reports.")

    # Step 4: Duplicate detection
    sim_state["step"] = 4
    await _log_activity(db, "system", "info", "Duplicate report detection running",
                         "AI engine scanning for repeated reports from same source clusters.")

    # Step 5: Contradiction detection
    sim_state["step"] = 5
    await _log_activity(db, "contradiction", "warning", "⚠️ CONTRADICTIONS DETECTED – Rampur & Krishnanagar",
                         "Report RPT003 conflicts with police report. Anonymous claim conflicts with official school collapse data.")

    # Step 6: Satellite evidence
    sim_state["step"] = 6
    await _log_activity(db, "satellite", "info", "📡 Satellite SAR imagery received – Rampur & Jhillimili",
                         "ISRO SAR analysis confirms 72% inundation at Rampur. Landslide debris visible at Jhillimili.")

    # Step 7: AI damage assessment
    sim_state["step"] = 7
    await _log_activity(db, "ai", "info", "🤖 AI Damage Assessment complete",
                         "Multiple collapsed structures identified. Rooftop clusters detected at Rampur.")

    # Step 8: Fog scores
    sim_state["step"] = 8
    await _log_activity(db, "system", "info", "Information Fog scores computed",
                         "Shilapur: 95% fog (BLACKOUT). Kurumundi: 88% fog. Rampur: 22% fog (high confidence).")

    # Step 9: Population at risk
    sim_state["step"] = 9
    await _log_activity(db, "system", "high", "Population at risk estimated",
                         "Total: 6,200+ people at risk across 15 villages. 1,800+ stranded.")

    # Step 10: Priority ranking
    sim_state["step"] = 10
    await _log_activity(db, "ai", "critical", "🎯 Rescue Priority Ranking complete",
                         "P1: Rampur (94), Krishnanagar (91), Jhillimili (87). P2: Kendupalli, Chandpur.")

    # Step 11: Resource allocation
    sim_state["step"] = 11
    await _do_auto_resource_allocation(db)
    await _log_activity(db, "deployment", "info", "🚣 Resource Allocation complete",
                         "Boat B-01 → Rampur. Boat B-04 → Jhillimili. Amb AMB-01 → Krishnanagar. Med Team → Kendupalli.")

    # Step 12: Route intelligence
    sim_state["step"] = 12
    await _log_activity(db, "route", "warning", "🛣️ Route Intelligence updated",
                         "NH-215 blocked. SH-27 flooded. Alternative: Baghmundi-Sadar Road open for relief trucks.")

    await _log_activity(db, "simulation", "info", "✅ SIMULATION COMPLETE – EOC Dashboard ready",
                         "All scores, resources, and routes have been updated. Command center is operational.")

    sim_state["running"] = False
    sim_state["step"] = 12
    sim_state["log"].append("Simulation complete")

    return {"success": True, "steps_completed": 12, "message": "Simulation complete. Dashboard updated."}


async def _do_auto_resource_allocation(db: AsyncSession):
    """Automatically deploy top resources to critical villages."""
    deployments = [
        ("RES001", "VLG001"),   # Boat B-01 → Rampur
        ("RES002", "VLG010"),   # Boat B-02 → Jhillimili
        ("RES005", "VLG004"),   # Ambulance → Krishnanagar
        ("RES007", "VLG012"),   # Medical Team → Kendupalli
        ("RES009", "VLG010"),   # Excavator → Jhillimili
        ("RES011", "VLG001"),   # Rescue Team → Rampur
    ]

    for res_id, vil_id in deployments:
        resource = await db.get(Resource, res_id)
        village = await db.get(Village, vil_id)
        if resource and village and resource.status == "available":
            resource.status = "deployed"
            resource.assigned_village_id = vil_id
            resource.current_lat = village.lat
            resource.current_lon = village.lon

            inc_result = await db.execute(
                select(Incident).where(Incident.village_id == vil_id)
            )
            inc = inc_result.scalars().first()
            if inc:
                assigned = list(inc.assigned_resources or [])
                if resource.name not in assigned:
                    assigned.append(resource.name)
                inc.assigned_resources = assigned

    await db.commit()


async def _log_activity(db: AsyncSession, event_type: str, severity: str, title: str, body: str, village_id: str = None):
    db.add(ActivityLog(
        id=str(uuid.uuid4())[:8],
        event_type=event_type,
        severity=severity,
        title=title,
        body=body,
        village_id=village_id,
        is_demo=True,
        timestamp=datetime.utcnow(),
    ))
    await db.commit()


def get_sim_state():
    return sim_state
