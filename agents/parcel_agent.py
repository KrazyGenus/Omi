import logging
import json
import os
from dotenv import load_dotenv
from uuid import uuid4
from typing import List, Optional, Dict, Any
from google import genai
from google.genai.errors import APIError
import datetime 

from utils.retrieve_db import retrieve_parcel_meta_by_id
from models.a2a import (
    A2AMessage, TaskResult, TaskStatus, Artifact,
    MessagePart, MessageConfiguration
)


load_dotenv()
# Set up basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


PARCEL_INPUT_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "parcel_id": {"type": "string", "description": "The unique identifier for the parcel, derived from 'Parcel Id'."},
            "carrier": {"type": "string", "description": "The logistics carrier name, derived from 'carrier'."}
        },
        "required": ["parcel_id", "carrier"],
        
    }
}


# --- Prompt Templates ---

# Prompt for JSON Conversion (Simplified, as schema enforces structure)
GEMINI_CLEANUP_PROMPT = """
You are an expert data serialization specialist. Your sole task is to extract the logistics data provided below and convert it precisely into the mandated JSON structure.

The raw input data, which consists of semicolon-separated records, is provided inside the <RAW_DATA> tags. Extract the 'Parcel Id' and 'carrier' for each record.

<RAW_DATA>
{{DATA_STRING}}
</RAW_DATA>
"""

# Prompt for Final Report Generation (Optimized with Clear Delimiters)

GEMINI_PACKAGE_RESPONSE_PROMPT = """
You are a highly efficient AI Parcel Data Processor. Your sole function is to transform the provided raw database tracking information into a succinct, actionable, and scannable summary report for a dropshipper.

1. Data Input (Authoritative Context):
Analyze the following database query results containing the current parcel status information. This data is provided inside the <DB_RESULTS> tags.

<DB_RESULTS>
{{db_result}}
</DB_RESULTS>

2. Geolocation Task: 
For every parcel, you must construct a Google Maps URL using the template: `https://maps.google.com/maps?q=[latitude],[longitude]`

3. Structure Mandate:
Compose a single, brief header followed by a bulleted list. Each bullet point MUST represent a single parcel and use this PRECISE, EXTENDED FORMAT:

[PARCEL ID] | STATUS | LAST LOCATION | ACTION REQUIRED/NEXT STEP | MAP LINK | CARRIER TRACKING LINK

Where:
- MAP LINK is the constructed Google Maps URL (e.g., `https://maps.google.com/maps?q=40.6413,-73.7781`).
- The ACTION REQUIRED/NEXT STEP remains a very short (maximum 7-word) description.

4. Output Requirement:
Provide ONLY the header and the bulleted list. DO NOT include any explanatory text, commentary, or conversational prose.
"""


def json_serial(obj):
    """
    JSON serializer for objects not serializable by default json code.
    Converts datetime objects to ISO 8601 strings.
    """
   
    if isinstance(obj, datetime.datetime): 
        return obj.isoformat()

    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")



async def process_message(client_payload: List[A2AMessage], context_id: Optional[str] = None, task_id: Optional[str] = None, config: Optional[MessageConfiguration] = None, db_session = None):
    # API Client Initialization
    api_key = os.getenv("GOOGLE_GEMENI_AI_KEY")
    if not api_key:
        logging.error("GEMINI_API_KEY is not set in environment variables.")
        raise ValueError("API key missing.")

    client = genai.Client(api_key=api_key)

    # Extract Payload Message
    payload_message = ""
    for payload in client_payload:
        for message in payload.parts:
            if message.text:
                payload_message = message.text
                logging.info(f"Received payload: {payload_message}")
                break
        if payload_message:
            break

    if not payload_message:
        logging.warning("No text message found in client payload.")
        return TaskResult(id=str(uuid4()), status=TaskStatus(state="failed", message=A2AMessage(role="agent", parts=[MessagePart(kind="text", text="Error: Input message was empty.")]))),

    #  First Gemini Call: Data Serialization (JSON-enforced)
    final_gemini_prompt = GEMINI_CLEANUP_PROMPT.replace(
        "{{DATA_STRING}}", payload_message
    )
    
    try:
        logging.info("Calling Gemini for JSON serialization (Schema Enforced)...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=final_gemini_prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": PARCEL_INPUT_SCHEMA,
            }
        )
        
        structured_output: List[Dict[str, str]] = json.loads(response.text.strip())
        logging.info(f"Structured output successfully parsed: {structured_output}")

    except APIError as e:
        logging.error(f"Gemini API Error during JSON conversion: {e}")
        return TaskResult(id=str(uuid4()), status=TaskStatus(state="failed", message=A2AMessage(role="agent", parts=[MessagePart(kind="text", text=f"API Error during data serialization: {e}")]))),
    except json.JSONDecodeError as e:
        logging.error(f"JSON Decoding Error after Gemini call: {e}")
        return TaskResult(id=str(uuid4()), status=TaskStatus(state="failed", message=A2AMessage(role="agent", parts=[MessagePart(kind="text", text="Error: Malformed JSON output from AI.")]))),


    # Database Retrieval
    try:
        # The structured_output now contains data ready for database query.
        db_result = await retrieve_parcel_meta_by_id(structured_output, db_session)
        logging.info("Database retrieval complete.")
    except (TimeoutError) as e:
        logging.error(f"Database Error: {e}")
        return TaskResult(id=str(uuid4()), status=TaskStatus(state="failed", message=A2AMessage(role="agent", parts=[MessagePart(kind="text", text="Error: Database retrieval failed.")]))),
    except Exception as e:
        logging.error(f"Unexpected error during DB retrieval: {e}")
        return TaskResult(id=str(uuid4()), status=TaskStatus(state="failed", message=A2AMessage(role="agent", parts=[MessagePart(kind="text", text="Error: Unexpected error during DB retrieval.")]))),


    # Second Gemini Call: Report Generation
    
    final_parcel_prompt = GEMINI_PACKAGE_RESPONSE_PROMPT.replace(
        "{{db_result}}", json.dumps(db_result, indent=2, default=json_serial)
    )
    try:
        logging.info("Calling Gemini for final report generation...")
        parcel_ret_response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=final_parcel_prompt
        )
        final_summary_text = parcel_ret_response.text.strip()
        logging.info("Report generation complete.")
        
    except APIError as e:
        logging.error(f"Gemini API Error during report generation: {e}")
        final_summary_text = f"An API error occurred during report generation: {e}"



    # Task Result Construction
    task_id_new = str(uuid4())
    
    content_part = MessagePart(
        kind="text",
        text=final_summary_text
    )

    response_message = A2AMessage(
        role="agent",
        parts=[MessagePart(kind="text", text="Periodic parcel status update completed and summarized.")],
        taskId=f"task-{task_id_new}",
        contextId=f"ctx-{context_id}" if context_id is not None else str(uuid4()),
    )

    # Defines the Build artifacts (the structured final output)
    artifacts = Artifact(
        name="Parcel Status Summary",
        parts=[content_part],
        taskId=f"task-{task_id_new}"
    )
    # A return of the constructed result, back to the agent.
    return TaskResult(
        id=f"task-{task_id_new}",
        contextId=f"ctx-{context_id}" if context_id is not None else str(uuid4()),
        status=TaskStatus(
            state="completed",
            timestamp=datetime.datetime.utcnow().isoformat(), 
            message=response_message
        ),
        artifacts=[artifacts],
        kind="task"
    )