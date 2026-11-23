import asyncio
import time
from typing import Dict, Any, List
from backend.database import insert_case, create_task, update_task, save_message, log_event, log_audit
from backend.tools.geocoding import geocode_location
from backend.agents.report_analysis import analyze_missing_person_report

# Global subscriber queues for Server-Sent Events (SSE)
sse_subscribers: List[asyncio.Queue] = []

async def broadcast_event(event: Dict[str, Any]):
    """Broadcasts event in real-time to all connected SSE clients."""
    for q in sse_subscribers:
        try:
            await q.put(event)
        except Exception:
            pass

async def run_mission_workflow(case_data: Dict[str, Any]):
    """
    Executes the Step 4 multi-agent pipeline:
    1. Orchestrator initializes mission and blackboard.
    2. Real tool: Geocodes location using Nominatim.
    3. Report Analysis: Real Gemini / safe fallback risk analysis.
    4. Orchestrator prepares blackboard task for spatial search planning.
    Every step writes to SQLite audit_log & events, and streams live via SSE.
    """
    case_id = case_data["case_id"]

    # -------------------------------------------------------------
    # STEP 0: Orchestrator Mission Initialized
    # -------------------------------------------------------------
    start_time = time.time()
    step0_event = {
        "stepIndex": 0,
        "timeOffsetSec": 0,
        "run_id": case_id,
        "agent": "orchestrator",
        "event_type": "agent_status_changed",
        "title": f"Mission Initialized: {case_data['name']} (Age {case_data['age']})",
        "summary": "New missing juvenile report ingested. High priority emergency protocol activated.",
        "payload": {"status": "thinking", "case_id": case_id},
        "particles": [
            {
                "from": "orchestrator",
                "to": "report_analysis",
                "label": "Dispatched Intake",
                "payloadPreview": f"Raw Report: {case_data['name']}, {case_data['age']}, {case_data.get('clothing', 'Blue shirt')}"
            }
        ],
        "thoughtTrace": {
            "agent": "orchestrator",
            "reasoning": f"Subject is a {case_data['age']}-year-old minor last seen at {case_data['last_seen_location']}. Initiating juvenile escalation protocol. Delegating intake parsing to Report Analysis Agent.",
            "toolsCalled": [{"name": "db.insert_case", "params": f"case_id='{case_id}'", "output": "Case Record Created"}],
            "confidence": 0.98,
            "alternatives": ["Treat as routine adult inquiry (Rejected: Subject is 16)", "Wait for 24h threshold (Prohibited by safety rules)"]
        }
    }
    log_event(step0_event)
    log_audit(case_id, "orchestrator", "initialize_mission", f"Case {case_id} registered", "Mission active", int((time.time() - start_time) * 1000), 120)
    save_message(case_id, "orchestrator", "report_analysis", f"Intake: {case_data['name']}", case_data)
    create_task(f"tsk-{case_id}-01", case_id, "Structure Report & Extract Clues", "report_analysis", "critical")
    await broadcast_event(step0_event)

    await asyncio.sleep(2.0)

    # -------------------------------------------------------------
    # STEP 1: Tool Call - OpenStreetMap Nominatim Geocoding
    # -------------------------------------------------------------
    geo_start = time.time()
    location_query = case_data.get("last_seen_location", "College Bus Stop")
    geo_result = await geocode_location(location_query)
    geo_duration = int((time.time() - geo_start) * 1000)

    step1_event = {
        "stepIndex": 1,
        "timeOffsetSec": 3,
        "run_id": case_id,
        "agent": "report_analysis",
        "event_type": "tool_result",
        "title": f"Spatial Anchor Geocoded: {location_query}",
        "summary": f"OSM Nominatim located: Lat {geo_result['lat']:.4f}, Lon {geo_result['lon']:.4f} ({geo_result['source']})",
        "payload": geo_result,
        "particles": [
            {
                "from": "report_analysis",
                "to": "orchestrator",
                "label": "Geocoded Anchor",
                "payloadPreview": f"Coords: {geo_result['lat']:.4f}, {geo_result['lon']:.4f}"
            }
        ],
        "thoughtTrace": {
            "agent": "report_analysis",
            "reasoning": f"Resolved spatial coordinates for '{location_query}' via OpenStreetMap Nominatim. Anchor established at ({geo_result['lat']:.4f}, {geo_result['lon']:.4f}).",
            "toolsCalled": [{"name": "nominatim_geocoding", "params": f"q='{location_query}'", "output": f"Lat: {geo_result['lat']}, Lon: {geo_result['lon']}"}],
            "confidence": 0.95,
            "alternatives": ["Manual coordinate entry (Skipped: Automated resolution successful)"]
        }
    }
    log_event(step1_event)
    log_audit(case_id, "report_analysis", "nominatim_geocode", location_query, f"Lat: {geo_result['lat']}, Lon: {geo_result['lon']}", geo_duration, 0)
    await broadcast_event(step1_event)

    await asyncio.sleep(2.5)

    # -------------------------------------------------------------
    # STEP 2: Report Analysis Agent - Gemini / Cached Fallback
    # -------------------------------------------------------------
    analysis_start = time.time()
    analysis = await analyze_missing_person_report(case_data)
    analysis_duration = int((time.time() - analysis_start) * 1000)

    update_task(f"tsk-{case_id}-01", "completed", 1.0)

    step2_event = {
        "stepIndex": 2,
        "timeOffsetSec": 6,
        "run_id": case_id,
        "agent": "report_analysis",
        "event_type": "task_created",
        "title": "Report Structured & Risk Evaluated",
        "summary": f"Extracted: Clothing ({analysis['extracted_entities'].get('clothing')}), Urgency: {analysis.get('urgency_score')}. Powered by {analysis.get('provider')}.",
        "payload": analysis,
        "particles": [
            {
                "from": "report_analysis",
                "to": "orchestrator",
                "label": "Structured Dossier",
                "payloadPreview": f"Urgency: {analysis.get('urgency_score')}, Safety Flags: {len(analysis.get('safety_flags', []))}"
            }
        ],
        "thoughtTrace": {
            "agent": "report_analysis",
            "reasoning": analysis.get("reasoning", "Extracted critical entities and transit vectors. Low battery warning flags communication cutoff."),
            "toolsCalled": [{"name": "gemini_extract_entities", "params": f"model='gemini-1.5-flash', subject='{case_data['name']}'", "output": f"Urgency: {analysis.get('urgency')}"}],
            "confidence": analysis.get("confidence", 0.94),
            "alternatives": ["Request more photos (Skipped: initial textual indicators sufficient for immediate perimeter)"],
            "urgencyScore": analysis.get("urgency_score")
        }
    }
    log_event(step2_event)
    log_audit(case_id, "report_analysis", "gemini_nlp_extract", f"Report: {case_data['name']}", f"Urgency: {analysis.get('urgency')}", analysis_duration, 480)
    save_message(case_id, "report_analysis", "orchestrator", f"Urgency: {analysis.get('urgency')}", analysis)
    await broadcast_event(step2_event)

    await asyncio.sleep(2.0)

    # -------------------------------------------------------------
    # STEP 3: Orchestrator Blackboard Update
    # -------------------------------------------------------------
    create_task(f"tsk-{case_id}-02", case_id, "Compute Zone Alpha & Timeline Isochrone", "search_planning", "high")

    step3_event = {
        "stepIndex": 3,
        "timeOffsetSec": 9,
        "run_id": case_id,
        "agent": "orchestrator",
        "event_type": "task_updated",
        "title": "Delegation Ready: Search Planning Hand-off",
        "summary": f"Intake complete. Orchestrator posting task #tsk-{case_id}-02 to Search Planning Agent for 1.5km Zone Alpha.",
        "payload": {"next_agent": "search_planning", "anchor": geo_result},
        "particles": [
            {
                "from": "orchestrator",
                "to": "search_planning",
                "label": "Anchor Coords",
                "payloadPreview": f"Anchor: {location_query}, Lat: {geo_result['lat']:.4f}, Lon: {geo_result['lon']:.4f}"
            }
        ],
        "thoughtTrace": {
            "agent": "orchestrator",
            "reasoning": f"Report intake and geocoding successfully finalized. All actions recorded to SQLite blackboard. Initiating spatial perimeter assignment for Search Planning Agent.",
            "toolsCalled": [{"name": "blackboard.post_task", "params": f"assigned='search_planning', priority='high'", "output": "Task Registered"}],
            "confidence": 0.96,
            "alternatives": ["City-wide broadcast (Rejected: focus search perimeter around bus stop corridor)"]
        }
    }
    log_event(step3_event)
    log_audit(case_id, "orchestrator", "delegate_search_planning", f"Coords: {geo_result['lat']}, {geo_result['lon']}", "Search Planning Awakened", 45, 80)
    await broadcast_event(step3_event)
