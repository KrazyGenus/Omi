from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import json
from models.a2a import (
    JSONRPCRequest,
    JSONRPCResponse,
    TaskResult,
    TaskStatus,
    Artifact,
    MessagePart,
    A2AMessage,
)
from agents.parcel_agent import parcelAgent
from config.db import Base, async_engine, get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Attempting a db table creation")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        yield


app = FastAPI(
    title="Parcel Tracker Agent A2A",
    description="Handle Parcel Tracking and customer relations on parcel delay",
    version="1.0.0",
    lifespan=lifespan,
)


@app.post("/a2a/parcel")
async def parcel_entry(request: Request):
    """Main A2A endpoint for parcel agent"""
    try:
        # A parse of the request body
        body = await request.body()
        body = json.loads(body.decode("utf-8"))
        # A validation of the fields included within the request body
        if body.get("jsonrpc") != "2.0" or "id" not in body:
            return JSONResponse(
                status_code=400,
                content={
                    "jsonrpc": "2.0",
                    "id": body.get("id"),
                    "error": {
                        "code": -32600,
                        "message": "Invalid JSON-RPC request, jsonrpc must be '2.0' and id is required",
                    },
                },
            )
        rpc_request = JSONRPCRequest(**body)

        # Extract messages
        messages = []
        context_id = None
        task_id = None
        config = None

        if rpc_request.method == "message/send":
            messages = [rpc_request.params.message]
            config = rpc_request.params.configuration
        elif rpc_request.method == "execute":
            messages = rpc_request.params.messages
            context_id = rpc_request.params.context_id
            task_id = rpc_request.params.task_id

        # Process and return the result
        parcelAgent.print_payload(messages)
    except Exception as e:
        print(e)


if __name__ == "__main__":
    PORT = 8000
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
