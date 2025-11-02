from pydantic import BaseModel, Field, HttpUrl
from typing import Literal, Optional, Dict, Any
from datetime import datetime


class Location(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    facility: Optional[str] = None


class Movement(BaseModel):
    previous_facility: Optional = None
    next_facility: Optional[str] = None
    estimated_arrival: Optional[datetime] = None

class Parcel(BaseModel):
    parcel_id: str = Field(..., description="Unique identifier for each parcel")
    status: Literal["pending", "in_transit", "delivered", "cancelled", "lost"]
    last_update: datetime
    location: Location
    movement: Movement
    carrier: Optional[str] = None
    tracking_url: Optional[HttpUrl] = None
    metadata: Dict[str, Any]