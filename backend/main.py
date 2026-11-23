import os
import json
import uuid
import asyncio
from typing import Dict, Any, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

from backend.database import init_db, insert_case, get_events_by_case, get_search_zones
from backend.agents.orchestrator import run_mission_workflow, handle_incoming_sighting, sse_subscribers

load_dotenv()

app = FastAPI(
    title="LostLink Multi-Agent Backend",
    description="Autonomous search & rescue coordination network powered by FastAPI and SQLite",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    print("[LostLink Backend] SQLite Database initialized & ready.")

class CaseIntakeRequest(BaseModel):
    name: str = Field(default="Rahul")
    age: int = Field(default=16)
    last_seen_time: str = Field(default="4:30 PM")
    last_seen_location: str = Field(default="College Bus Stop")
    clothing: str = Field(default="Royal blue shirt, black trousers")
    details: Optional[Dict[str, Any]] = Field(default_factory=lambda: {
        "transit_route": "Bus 42B",
        "battery": "Low (Pinged at 4:45 PM)"
    })

class SightingWebhookRequest(BaseModel):
    location: str = Field(default="Park Metro")
    time: str = Field(default="5:15 PM")
    description: str = Field(default="Boy in royal blue shirt asking for directions near Station Concourse")
    source: str = Field(default="community_webhook")

@app.get("/api/health")
def health_check():
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    return {
        "status": "healthy",
        "service": "LostLink Multi-Agent Backend",
        "database": "SQLite (Connected)",
        "gemini_configured": bool(gemini_key.strip()),
        "sse_subscribers_count": len(sse_subscribers)
    }

@app.post("/api/cases")
async def submit_case(report: CaseIntakeRequest, background_tasks: BackgroundTasks):
    """
    Submits a new missing person report and triggers the autonomous multi-agent pipeline in background.
    """
    case_id = f"run-rahul-{uuid.uuid4().hex[:4]}"
    case_data = {
        "case_id": case_id,
        "name": report.name,
        "age": report.age,
        "last_seen_time": report.last_seen_time,
        "last_seen_location": report.last_seen_location,
        "clothing": report.clothing,
        "details": report.details or {},
        "urgency": "CRITICAL" if report.age < 18 else "HIGH"
    }

    # Save to SQLite blackboard
    insert_case(case_data)

    # Launch asynchronous multi-agent background task
    background_tasks.add_task(run_mission_workflow, case_data)

    return {
        "case_id": case_id,
        "status": "initiated",
        "urgency": case_data["urgency"],
        "message": f"Autonomous case pipeline initiated for {report.name}"
    }

@app.post("/api/cases/{case_id}/sightings")
async def submit_sighting(case_id: str, sighting: SightingWebhookRequest, background_tasks: BackgroundTasks):
    """
    Ingests an incoming sighting (via webhook or form).
    Wakes the Orchestrator to decide verification, re-planning, and task re-assignment.
    """
    sighting_dict = sighting.dict()
    background_tasks.add_task(handle_incoming_sighting, case_id, sighting_dict)

    return {
        "status": "received",
        "case_id": case_id,
        "sighting": sighting_dict,
        "message": "Sighting ingested. Orchestrator awakened for verification and autonomous re-planning."
    }

@app.get("/api/cases/{case_id}/zones")
def get_zones(case_id: str):
    """
    Returns active and decayed search zones for the Leaflet map.
    """
    zones = get_search_zones(case_id)
    return {"case_id": case_id, "zones": zones}

@app.get("/api/cases/{case_id}/events")
def get_case_events(case_id: str):
    """
    Fetches all historical events for timeline scrub and audit replay.
    """
    events = get_events_by_case(case_id)
    return {"case_id": case_id, "count": len(events), "events": events}

@app.get("/api/events/stream")
async def events_stream():
    """
    Server-Sent Events (SSE) stream endpoint. Real-time agent status, particle telemetry,
    and decisions are pushed immediately to all connected Observatory frontends.
    """
    queue: asyncio.Queue = asyncio.Queue()
    sse_subscribers.append(queue)

    async def event_generator():
        try:
            yield {
                "event": "connected",
                "data": json.dumps({"status": "connected", "stream": "LostLink Agent Observatory SSE"})
            }
            while True:
                event_data = await queue.get()
                yield {
                    "event": "agent_event",
                    "data": json.dumps(event_data)
                }
        except asyncio.CancelledError:
            pass
        finally:
            if queue in sse_subscribers:
                sse_subscribers.remove(queue)

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
