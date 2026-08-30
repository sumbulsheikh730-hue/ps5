"""Alert model"""

from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False)   # critical_zone, contradiction, blackout, medical_cluster, resource_shortage, route_blocked, satellite_evidence
    severity = Column(String(20), default="info")     # critical, warning, info
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    village_id = Column(Integer, nullable=True)
    village_name = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False)
    is_simulation = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
