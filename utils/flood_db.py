from config.db import Base, async_engine, get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from models.db_model import Parcel
from sqlalchemy.exc import TimeoutError, OperationalError
from fastapi import Depends

from datetime import datetime, timedelta

parcel_seed_data = [
    
    {
        "parcel_id": "PKG002NG",
        "status": "delivered",
        "last_update": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
        "location": {
            "latitude": 6.5244,
            "longitude": 3.3792,
            "city": "Lagos",
            "state": "Lagos",
            "country": "Nigeria",
            "facility": "Ikeja Delivery Center",
        },
        "movement": {
            "previous_facility": "London Heathrow Hub",
            "next_facility": None,
            "estimated_arrival": (datetime.utcnow() - timedelta(hours=7)).isoformat(),
        },
        "carrier": "DHL",
        "tracking_url": "https://www.dhl.com/track?PKG002NG",
        "metadata": {"weight_kg": 3.2, "priority": "express"},
    },
    
    {
        "parcel_id": "PKG003JP",
        "status": "pending",
        "last_update": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "location": {
            "latitude": 35.6762,
            "longitude": 139.6503,
            "city": "Tokyo",
            "country": "Japan",
            "facility": "Shinjuku Dispatch Center",
        },
        "movement": {
            "previous_facility": None,
            "next_facility": "Narita Airport Hub",
            "estimated_arrival": (datetime.utcnow() + timedelta(days=3)).isoformat(),
        },
        "carrier": "Japan Post",
        "tracking_url": "https://www.post.japanpost.jp/track?PKG003JP",
        "metadata": {"weight_kg": 0.5, "priority": "economy"},
    },
    
    {
        "parcel_id": "PKG004GB",
        "status": "lost",
        "last_update": (datetime.utcnow() - timedelta(days=5)).isoformat(),
        "location": {
            "latitude": 51.5074,
            "longitude": -0.1278,
            "city": "London",
            "country": "United Kingdom",
            "facility": "Unknown",
        },
        "movement": {
            "previous_facility": "Amsterdam Hub",
            "next_facility": None,
            "estimated_arrival": None,
        },
        "carrier": "Royal Mail",
        "tracking_url": "https://www.royalmail.com/track?PKG004GB",
        "metadata": {"weight_kg": 2.0, "priority": "standard"},
    },
    
    {
        "parcel_id": "PKG005DE",
        "status": "in_transit",
        "last_update": (datetime.utcnow() - timedelta(hours=3)).isoformat(),
        "location": {
            "latitude": 52.5200,
            "longitude": 13.4050,
            "city": "Berlin",
            "country": "Germany",
            "facility": "Berlin Central Sorting Center",
        },
        "movement": {
            "previous_facility": "Munich Hub",
            "next_facility": "Hamburg Distribution Hub",
            "estimated_arrival": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        },
        "carrier": "Hermes",
        "tracking_url": "https://www.myhermes.de/track?PKG005DE",
        "metadata": {"weight_kg": 4.4, "priority": "express"},
    }, 
]


async def populate_db(db_session):
    for parcel in parcel_seed_data:
        parcel_entry = Parcel(**parcel)
        db_session.add(parcel_entry)
    await db_session.commit()
    