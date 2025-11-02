from config.db import Base, async_engine, get_async_db
from sqlalchemy.ext.asyncio import AsyncSession

async def populate_db(db_session: AsyncSession = Depends(get_async_db)):
    