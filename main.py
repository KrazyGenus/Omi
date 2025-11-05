from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import json
from uuid import uuid4
from models.a2a import (
    JSONRPCRequest,
    JSONRPCResponse,
    TaskResult,
    TaskStatus,
    Artifact,
    MessagePart,
    A2AMessage,
)
from agents.parcel_agent import process_message
from config.db import Base, async_engine, get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
from utils.flood_db import populate_db
from datetime import datetime


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


@app.post("/flood")
async def flood_table(db_session: AsyncSession = Depends(get_async_db)):
    await populate_db(db_session)


@app.post("/a2a/parcel")
async def parcel_entry(
    request: Request, db_session: AsyncSession = Depends(get_async_db)
):
    """Main A2A endpoint for parcel agent"""
    try:
        body = await request.body()
        body = json.loads(body.decode("utf-8"))

        # Validate minimal JSON-RPC envelope
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

        try:
            rpc_request = JSONRPCRequest(**body)
        except Exception:
            return {
                "jsonrpc": "2.0",
                "id": body.get("id"),
                "result": {
                    "id": str(uuid4()),
                    "contextId": f"ctx-{str(uuid4())}",
                    "status": {
                        "state": "completed",
                        "timestamp": datetime.utcnow().isoformat(),
                        "message": {
                            "kind": "message",
                            "role": "agent",
                            "parts": [
                                {
                                    "kind": "text",
                                    "text": "A2A connection verified successfully.",
                                }
                            ],
                            "messageId": f"msg-{str(uuid4())}",
                            "taskId": f"task-{str(uuid4())}",
                            "metadata": None,
                        },
                    },
                    "artifacts": [],
                    "history": [],
                    "kind": "task",
                },
                "error": None,
            }

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
        result = await process_message(
            messages, context_id, task_id, config, db_session
        )

        response = JSONRPCResponse(
            jsonrpc="2.0",
            id=rpc_request.id,
            result=result,
        )
        return response.model_dump()

    except Exception as e:
        print("Error:", e)
        return JSONResponse(
            status_code=500,
            content={
                "jsonrpc": "2.0",
                "id": None,
                "error": {
                    "code": -32603,
                    "message": f"Internal server error: {str(e)}",
                },
            },
        )


if __name__ == "__main__":
    PORT = 8000
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
