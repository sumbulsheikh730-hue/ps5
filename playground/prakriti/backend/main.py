"""
PRAKRITI – AI Disaster Intelligence & Response System
Main FastAPI application entry point
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.database import init_db
from app.api import villages, reports, resources, routes, simulation, damage, analytics, alerts

load_dotenv()

app = FastAPI(
    title="PRAKRITI API",
    description="AI Disaster Intelligence & Response System",
    version="1.0.0",
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(villages.router, prefix="/api/villages", tags=["villages"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(resources.router, prefix="/api/resources", tags=["resources"])
app.include_router(routes.router, prefix="/api/routes", tags=["routes"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(damage.router, prefix="/api/damage", tags=["damage"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])


@app.on_event("startup")
async def startup_event():
    await init_db()


@app.get("/api/health")
async def health():
    return {"status": "ok", "system": "PRAKRITI", "version": "1.0.0"}
