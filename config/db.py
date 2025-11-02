import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
from typing import AsyncGenerator
import ssl

# This load the env file
load_dotenv()

# Load database environment URL
DATABASE_URL = os.getenv("DATABASE_URL")


if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")


# Fetch the path to the ca.pem file, required by MySQL cloud provider
CA_FILE_PATH = "config/ca.pem"


# A connection is created to the remote db using SSL
ssl_context = None
try:
    ssl_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
    ssl_context.load_verify_locations(CA_FILE_PATH)
except Exception as ssl_exception:
    print("Unable to create a connection to remote db server", ssl_exception)


# An attempt to create an async engine
async_engine = None
try:
    async_engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        pool_size=10,
        max_overflow=20,
        connect_args={"ssl": ssl_context},
    )
except Exception as db_engine:
    print("Unable to create an engine", db_engine)


# An attempt to create an AsyncSession
AsyncSessionLocal = None
try:
    AsyncSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=async_engine, expire_on_commit=False
    )
except Exception as async_session:
    print("Unable to create async session", async_session)

# Base for ORM models
Base = declarative_base()


# Asynchronous dependency injection function
async def get_async_db() -> AsyncGenerator(AsyncSession, None):
    """
    Dependency that provides an asynchronous database session.
    It automatically handles session creation and cleanup (closing).
    """
    async with AsyncSessionLocal() as session:
        yield session
