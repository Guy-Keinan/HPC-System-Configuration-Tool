from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Configuration(Base):
    __tablename__ = "configurations"

    id = Column(Integer, primary_key=True, index=True)
    configuration_data = Column(Text, nullable=False)  # JSON string of complete config
    configuration_id = Column(String(255), unique=True, nullable=True)  # Generated ID
    is_generated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class NodePricing(Base):
    __tablename__ = "node_pricing"

    nodes_count = Column(Integer, primary_key=True, index=True)
    price_usd = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 