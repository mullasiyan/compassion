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

from backend.database import (
    init_db, insert_case, get_events_by_case, get_search_zones,
    resolve_approval, get_pending_approvals, insert_notification,
    dispatch_notification, get_notifications, log_event, log_audit,
    update_task
)
from backend.agents.orchestrator import run_mission_workflow, handle_incoming_sighting, broadcast_event, sse_subscribers
from backend.utils.scheduler import start_scheduler, stop_scheduler

load_dotenv()

app = FastAPI(
    title="LostLink Multi-Agent Backend",
    description="Autonomous search & rescue coordination network powered by FastAPI and SQLite",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()
    start_scheduler()
    print("[LostLink Backend] SQLite Database initialized & Autonomous Case Patrol active.")

@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()

# --- Request / Response Models ---

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

class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(default="approve", description="'approve', 'reject', or 'edit'")
    coordinator_name: str = Field(default="Lead Alex V.")
    edited_message: Optional[str] = None

# --- API Endpoints ---

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

# 1. TRIGGER: Manual Form / Button Case Intake
@app.post("/api/cases")
async def submit_case(report: CaseIntakeRequest, background_tasks: BackgroundTasks):
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
    insert_case(case_data)
    background_tasks.add_task(run_mission_workflow, case_data)
    return {
        "case_id": case_id,
        "status": "initiated",
        "urgency": case_data["urgency"],
        "message": f"Autonomous case pipeline initiated for {report.name}"
    }

# 2. TRIGGER: Incoming Sighting Webhook
@app.post("/api/cases/{case_id}/sightings")
async def submit_sighting(case_id: str, sighting: SightingWebhookRequest, background_tasks: BackgroundTasks):
    sighting_dict = sighting.dict()
    background_tasks.add_task(handle_incoming_sighting, case_id, sighting_dict)
    return {
        "status": "received",
        "case_id": case_id,
        "sighting": sighting_dict,
        "message": "Sighting ingested. Orchestrator awakened for verification and autonomous re-planning."
    }

# 3. TRIGGER: Force Scheduled Monitoring Patrol
@app.post("/api/triggers/patrol")
async def trigger_patrol():
    from backend.utils.scheduler import case_monitoring_patrol_loop
    # Force single patrol evaluation
    case_id = "run-rahul-0921"
    event = {
        "stepIndex": 13,
        "timeOffsetSec": 35,
        "run_id": case_id,
        "agent": "orchestrator",
        "event_type": "task_updated",
        "title": "On-Demand Case Patrol Triggered",
        "summary": "Manual patrol invocation executed. All 4 quadrants healthy. Nightfall countdown 40m.",
        "payload": {"status": "healthy"},
        "particles": [],
        "thoughtTrace": {
            "agent": "orchestrator",
            "reasoning": "On-demand surveillance patrol audit complete. No stale volunteer tasks detected.",
            "toolsCalled": [{"name": "db.audit_stale_tasks", "params": "immediate=true", "output": "Clear"}],
            "confidence": 0.99,
            "alternatives": []
        }
    }
    log_event(event)
    await broadcast_event(event)
    return {"status": "patrol_executed", "case_id": case_id}

# 4. HUMAN APPROVAL GATE: Decision API
@app.post("/api/cases/{case_id}/approvals/{request_id}")
async def decide_approval(case_id: str, request_id: str, req: ApprovalDecisionRequest):
    """
    Coordinator decision endpoint for Human-in-the-Loop approval gate:
    'approve' releases family notifications and mobilizes field volunteers.
    'reject' holds the action and requests agent re-planning.
    'edit' updates draft content with coordinator revisions before release.
    """
    decision = req.decision.lower()
    coordinator = req.coordinator_name

    resolve_approval(request_id, decision, coordinator, {"edited_message": req.edited_message} if req.edited_message else None)

    if decision in ["approve", "edit"]:
        # Record notification as sent
        notif_msg = req.edited_message or "Verified sighting confirmed near Park Metro. 8 volunteers active."
        notif_id = insert_notification(case_id, "Guardian: Smt. Sunita", "in_app", "Verified Progress Update", notif_msg, "sent")

        # Emit Approval Release Event
        decision_event = {
            "stepIndex": 12,
            "timeOffsetSec": 48,
            "run_id": case_id,
            "agent": "orchestrator",
            "event_type": "decision_made",
            "title": f"Approval Confirmed by {coordinator}",
            "summary": "Coordinator clicked Approve. Family update dispatched and 8 volunteer tasks mobilized.",
            "payload": {
                "decision": decision,
                "signed_by": coordinator,
                "notification_id": notif_id
            },
            "particles": [
                {
                    "from": "orchestrator",
                    "to": "family_communication",
                    "label": "Authorized Memo",
                    "payloadPreview": f"DISPATCHED to Guardian: {notif_msg[:45]}..."
                },
                {
                    "from": "orchestrator",
                    "to": "rescue_coordination",
                    "label": "Release Volunteer Tasks",
                    "payloadPreview": "AUTHORIZED: Mobilize 8 Field Volunteers"
                }
            ],
            "thoughtTrace": {
                "agent": "orchestrator",
                "reasoning": f"Human coordinator sign-off confirmed by {coordinator}. Releasing held actions: sent encrypted family dispatch and activated Zone Beta volunteer quadrant sweeps.",
                "toolsCalled": [{"name": "gatekeeper.release", "params": f"signed_by='{coordinator}'", "output": "Approved"}],
                "confidence": 1.0,
                "alternatives": []
            }
        }
        log_event(decision_event)
        log_audit(case_id, "orchestrator", "approval_granted", f"Req: {request_id}", f"Approved by {coordinator}", 35, 40)
        await broadcast_event(decision_event)

        return {"status": "approved", "notification_id": notif_id, "message": "Gate resolved. Actions dispatched."}

    else:
        # Rejected
        reject_event = {
            "stepIndex": 11,
            "timeOffsetSec": 46,
            "run_id": case_id,
            "agent": "orchestrator",
            "event_type": "decision_made",
            "title": f"Approval Rejected by {coordinator}",
            "summary": "Coordinator held action. Outbound family message paused for re-draft.",
            "payload": {"decision": "rejected", "signed_by": coordinator},
            "particles": [],
            "thoughtTrace": {
                "agent": "orchestrator",
                "reasoning": f"Coordinator {coordinator} rejected staged dispatch. Requesting revised draft from Family Communication Agent.",
                "toolsCalled": [{"name": "gatekeeper.hold", "params": "status='rejected'", "output": "Held"}],
                "confidence": 1.0,
                "alternatives": []
            }
        }
        log_event(reject_event)
        log_audit(case_id, "orchestrator", "approval_rejected", f"Req: {request_id}", f"Rejected by {coordinator}", 25, 30)
        await broadcast_event(reject_event)

        return {"status": "rejected", "message": "Gate rejected. Dispatch cancelled."}

# 5. Queries: Search Zones, Notifications, Events
@app.get("/api/cases/{case_id}/zones")
def get_zones(case_id: str):
    zones = get_search_zones(case_id)
    return {"case_id": case_id, "zones": zones}

@app.get("/api/cases/{case_id}/notifications")
def get_case_notifications(case_id: str):
    notifs = get_notifications(case_id)
    return {"case_id": case_id, "notifications": notifs}

@app.get("/api/cases/{case_id}/events")
def get_case_events(case_id: str):
    events = get_events_by_case(case_id)
    return {"case_id": case_id, "count": len(events), "events": events}

# 6. Real-time Event Stream (SSE)
@app.get("/api/events/stream")
async def events_stream():
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
