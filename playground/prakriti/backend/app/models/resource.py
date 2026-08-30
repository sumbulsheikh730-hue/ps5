"""Rescue Resource model"""

from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)   # B-01, AMB-03, etc.
    name = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)  # boat, ambulance, medical_team, excavator, personnel, relief_truck
    capacity = Column(Integer, default=1)

    # Status
    status = Column(String(30), default="available")  # available, deployed, transit, maintenance
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    base_location = Column(String(100), nullable=True)

    # Assignment
    assigned_village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    assigned_village_name = Column(String(100), nullable=True)
    assignment_reason = Column(Text, nullable=True)
    assigned_at = Column(DateTime, nullable=True)

    # Simulation
    is_simulation = Column(Boolean, default=False)

    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
