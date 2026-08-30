"""Incident Report model"""

from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    village_name = Column(String(100), nullable=False)

    # Reporter
    reporter_name = Column(String(100), default="Anonymous")
    source_type = Column(String(50), nullable=False)  # citizen, official, police, social_media, satellite, sensor
    reporter_contact = Column(String(100), nullable=True)

    # Incident
    disaster_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    urgency = Column(String(20), default="moderate")  # critical, high, moderate, low
    affected_count = Column(Integer, default=0)

    # Location
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    location_text = Column(String(200), nullable=True)

    # AI analysis
    reliability_score = Column(Float, default=50.0)    # 0-100
    duplicate_probability = Column(Float, default=0.0) # 0-100
    is_duplicate = Column(Boolean, default=False)
    contradiction_flag = Column(Boolean, default=False)
    contradiction_detail = Column(JSON, default=dict)
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String(100), nullable=True)

    # Image
    image_path = Column(String(300), nullable=True)
    ai_damage_result = Column(JSON, default=dict)

    # Metadata
    timestamp = Column(DateTime, server_default=func.now())
    is_simulation = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now())
