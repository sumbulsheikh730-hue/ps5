from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid
import enum


def gen_id():
    return str(uuid.uuid4())[:8]


class DisasterType(str, enum.Enum):
    FLOOD = "flood"
    LANDSLIDE = "landslide"
    CYCLONE = "cyclone"
    EARTHQUAKE = "earthquake"
    BUILDING_COLLAPSE = "building_collapse"
    FIRE = "fire"
    ROAD_FAILURE = "road_failure"
    INDUSTRIAL = "industrial"


class SeverityLevel(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    UNKNOWN = "unknown"


class Village(Base):
    __tablename__ = "villages"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    block = Column(String, nullable=False)
    district = Column(String, default="Suvarnapur")
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    population = Column(Integer, default=0)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    incidents = relationship("Incident", back_populates="village", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="village", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=gen_id)
    village_id = Column(String, ForeignKey("villages.id"), nullable=False)
    source_type = Column(String, default="citizen")  # citizen, official, police, social_media, satellite, sensor
    reporter_name = Column(String, default="Anonymous")
    disaster_types = Column(JSON, default=list)
    description = Column(Text)
    severity = Column(String, default="unknown")
    people_affected = Column(Integer, default=0)
    urgency = Column(Integer, default=3)  # 1-5
    image_path = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    is_verified = Column(Boolean, default=False)
    reliability_score = Column(Float, default=50.0)
    is_duplicate = Column(Boolean, default=False)
    duplicate_of = Column(String, nullable=True)
    is_demo = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    village = relationship("Village", back_populates="reports")
    contradictions = relationship(
        "Contradiction",
        primaryjoin="or_(Report.id==Contradiction.report_a_id, Report.id==Contradiction.report_b_id)",
        foreign_keys="[Contradiction.report_a_id, Contradiction.report_b_id]",
        viewonly=True,
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=gen_id)
    village_id = Column(String, ForeignKey("villages.id"), nullable=False)
    disaster_types = Column(JSON, default=list)
    severity = Column(String, default="unknown")
    severity_score = Column(Float, default=0.0)
    people_at_risk = Column(Integer, default=0)
    people_stranded = Column(Integer, default=0)
    vulnerable_population = Column(Integer, default=0)
    medical_emergencies = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.0)
    information_fog_score = Column(Float, default=100.0)
    accessibility_score = Column(Float, default=50.0)
    rescue_priority_score = Column(Float, default=0.0)
    rescue_priority_class = Column(String, default="P4")
    road_accessible = Column(Boolean, default=True)
    has_communication = Column(Boolean, default=True)
    last_report_time = Column(DateTime, nullable=True)
    assigned_resources = Column(JSON, default=list)
    evidence_breakdown = Column(JSON, default=dict)
    priority_explanation = Column(JSON, default=list)
    fog_factors = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    village = relationship("Village", back_populates="incidents")


class Contradiction(Base):
    __tablename__ = "contradictions"

    id = Column(String, primary_key=True, default=gen_id)
    village_id = Column(String, ForeignKey("villages.id"), nullable=False)
    report_a_id = Column(String, ForeignKey("reports.id"), nullable=False)
    report_b_id = Column(String, ForeignKey("reports.id"), nullable=False)
    contradiction_type = Column(String)  # severity, disaster_type, people_count
    claim_a = Column(Text)
    claim_b = Column(Text)
    current_confidence = Column(Float, default=50.0)
    suggested_action = Column(Text)
    is_resolved = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=True)
    detected_at = Column(DateTime, default=datetime.utcnow)

    report_a = relationship("Report", foreign_keys=[report_a_id])
    report_b = relationship("Report", foreign_keys=[report_b_id])


class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    resource_type = Column(String)  # boat, ambulance, medical_team, excavator, rescue_personnel, relief_truck
    status = Column(String, default="available")  # available, deployed, en_route, maintenance
    base_lat = Column(Float)
    base_lon = Column(Float)
    current_lat = Column(Float, nullable=True)
    current_lon = Column(Float, nullable=True)
    assigned_village_id = Column(String, ForeignKey("villages.id"), nullable=True)
    capacity = Column(Integer, default=10)
    is_demo = Column(Boolean, default=True)

    assigned_village = relationship("Village")


class Road(Base):
    __tablename__ = "roads"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String)
    from_village_id = Column(String, ForeignKey("villages.id"), nullable=True)
    to_village_id = Column(String, ForeignKey("villages.id"), nullable=True)
    from_lat = Column(Float)
    from_lon = Column(Float)
    to_lat = Column(Float)
    to_lon = Column(Float)
    status = Column(String, default="open")  # open, blocked, flooded, damaged
    road_type = Column(String, default="district")  # national, state, district, village
    risk_level = Column(String, default="low")
    is_demo = Column(Boolean, default=True)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=gen_id)
    event_type = Column(String)
    severity = Column(String, default="info")
    title = Column(Text)
    body = Column(Text, nullable=True)
    village_id = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    is_demo = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class SimulationState(Base):
    __tablename__ = "simulation_state"

    id = Column(Integer, primary_key=True, default=1)
    is_running = Column(Boolean, default=False)
    step = Column(Integer, default=0)
    total_steps = Column(Integer, default=12)
    scenario_name = Column(String, default="")
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
