import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
from typing import AsyncGenerator
import ssl
# 1. Configuration and Environment Variables
load_dotenv()
# CRITICAL FIX: Correctly retrieve the environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("The DATABASE_URL environment variable is not set.")

# Use the specific asynchronous MariaDB/MySQL driver (e.g., aiomysql)
# Ensure your URL starts with 'mariadb+aiomysql://' or 'mysql+aiomysql://'
# Note: MariaDB is a fork of MySQL, so the MySQL dialect often works.
# Example: mariadb+aiomysql://user:password@host:3306/dbname

CA_FILE_PATH = "config/ca.pem"
ssl_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
ssl_context.load_verify_locations(CA_FILE_PATH)

async_engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_size=10, 
    max_overflow=20,
    connect_args= { "ssl": ssl_context }
)

# Use AsyncSession, which is the context-aware session for async operations
AsyncSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=async_engine, 
    class_=AsyncSession, # MUST specify AsyncSession
    expire_on_commit=False # Essential for the ORM to function properly with async/await
)

# Base for your ORM models
Base = declarative_base()

# 3. Asynchronous Dependency Injection Function
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides an asynchronous database session.
    It automatically handles session creation and cleanup (closing).
    """
    async with AsyncSessionLocal() as db:
        try:
            print(db)
            yield db
        except Exception as e:
            # You can log the error here or raise a custom exception
            print(f"An Error Occurred during asynchronous database connection: {e}")
            await db.rollback() # Ensure transaction is rolled back on error
            raise # Re-raise the exception for FastAPI to handle
        finally:
            # The 'async with' block implicitly closes the session, but we 
            # explicitly close if a synchronous pattern was used (optional here)
            pass