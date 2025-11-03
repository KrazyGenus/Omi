from sqlalchemy import select
from models.db_model import Parcel
from typing import Any, List, Dict, Optional


async def retrieve_parcel_meta_by_id(
    parcel_list: List[Dict[str, Any]], db_session: Any
) -> List[Dict[str, Optional[str]]]:
    """Retrives parcel metadata for a list of parcel dictionaries using a single query"""
    parcels_ids = [
        item.get("parcel_id").strip()
        for item in parcel_list
        if item and item.get("parcel_id")
    ]
    if not parcels_ids:
        return []

    selection = select(Parcel).where(Parcel.parcel_id.in_(parcels_ids))

    parcel_payload = await db_session.execute(selection)
    parcel_objects = parcel_payload.scalars().all()

    results = []
    for parcel in parcel_objects:
        results.append(
            {
                "parcel_id": parcel.parcel_id,
                "status": parcel.status,
                "last_update": parcel.last_update,
                "location": parcel.location,
                "movement": parcel.movement,
                "carrier": parcel.carrier,
                "tracking_url": parcel.tracking_url,
            }
        )
    print("From DB with LOVE: ", results)
    return results
