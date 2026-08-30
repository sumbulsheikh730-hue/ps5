from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db, AsyncSessionLocal
from app.services.seeder import seed_demo_data
from app.api import dashboard
from app.api import villages
from app.api import reports
from app.api import resources
from app.api import ai_analysis
from app.api import simulation
from app.api import hitl
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_demo_data(db)
    yield
    # Shutdown


app = FastAPI(
    title="PRAKRITI – AI Disaster Intelligence & Response System",
    description="Post-disaster information intelligence, evidence fusion, and rescue prioritization platform.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory for static file access
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(dashboard.router)
app.include_router(villages.router)
app.include_router(reports.router)
app.include_router(resources.router)
app.include_router(resources.route_router)
app.include_router(ai_analysis.router)
app.include_router(simulation.router)
app.include_router(hitl.router)


@app.get("/")
async def root():
    return {
        "app": "PRAKRITI – AI Disaster Intelligence & Response System",
        "status": "operational",
        "demo_mode": settings.AI_MODE == "demo",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "ai_mode": settings.AI_MODE}
