"""Road / Route model"""

from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base


class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)   # R-01, NH-17 etc.
    name = Column(String(100), nullable=False)
    road_type = Column(String(30), default="village_road")   # highway, district_road, village_road, bridge

    # Endpoints
    from_location = Column(String(100), nullable=False)
    to_location = Column(String(100), nullable=False)
    from_lat = Column(Float, nullable=False)
    from_lng = Column(Float, nullable=False)
    to_lat = Column(Float, nullable=False)
    to_lng = Column(Float, nullable=False)
    waypoints = Column(JSON, default=list)   # list of [lat,lng]

    # Status
    status = Column(String(30), default="open")  # open, blocked, flooded, damaged, caution
    block_reason = Column(String(200), nullable=True)
    risk_level = Column(String(20), default="low")   # low, medium, high, critical

    # Metrics
    distance_km = Column(Float, default=0.0)
    estimated_time_min = Column(Integer, default=0)
    suitable_for = Column(JSON, default=list)    # ["boat", "ambulance", "truck", "excavator"]

    is_simulation = Column(Boolean, default=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
