from datetime import datetime
from sqlalchemy import Column, Float, String, DateTime, JSON
from config.db import Base


class Parcel(Base):
    __tablename__ = "parcels"
    prcel_id = Column(String, primary_key=True)
    status = Column(String, nullable=False)
    last_update = Column(DateTime, nullable=False)
    location = Column(JSON)
    movement = Column(JSON)
    carrier = Column(String)
    tracking_url = Column(String)
    metadata = Column(JSON)
