"""Village / Affected Location model"""

from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    block = Column(String(100), nullable=False)
    district = Column(String(100), default="Aranyapur District")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Disaster info
    disaster_types = Column(JSON, default=list)   # ["flood", "landslide", ...]
    severity = Column(String(20), default="low")  # critical, high, moderate, low
    severity_score = Column(Float, default=0.0)   # 0-100

    # Population
    total_population = Column(Integer, default=0)
    affected_population = Column(Integer, default=0)
    stranded_population = Column(Integer, default=0)
    vulnerable_population = Column(Integer, default=0)
    medical_emergencies = Column(Integer, default=0)

    # Scores
    rescue_priority_score = Column(Float, default=0.0)     # 0-100
    priority_class = Column(String(5), default="P4")       # P1-P4
    confidence_score = Column(Float, default=0.0)          # 0-100
    information_fog_score = Column(Float, default=0.0)     # 0-100
    accessibility_score = Column(Float, default=100.0)     # 0-100

    # Status
    is_accessible = Column(Boolean, default=True)
    communication_active = Column(Boolean, default=True)
    last_report_time = Column(DateTime, nullable=True)
    communication_gap_hours = Column(Float, default=0.0)

    # Evidence
    report_count = Column(Integer, default=0)
    verified_report_count = Column(Integer, default=0)
    contradiction_count = Column(Integer, default=0)

    # Priority explanation
    priority_reasons = Column(JSON, default=list)
    evidence_breakdown = Column(JSON, default=dict)

    # Resource assignment
    assigned_resources = Column(JSON, default=list)

    # Timeline
    timeline = Column(JSON, default=list)

    # Simulation flag
    is_simulation = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
