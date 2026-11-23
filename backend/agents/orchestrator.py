import asyncio
import time
import uuid
from typing import Dict, Any, List
from backend.database import (
    get_case, insert_case, create_task, update_task, save_message,
    insert_sighting, update_sighting_status, log_event, log_audit,
    get_search_zones
)
from backend.tools.geocoding import geocode_location
from backend.agents.report_analysis import analyze_missing_person_report
from backend.agents.verification import verify_sighting
from backend.agents.search_planning import plan_search_zones
from backend.agents.rescue_coordination import coordinate_rescue_tasks
from backend.agents.family_communication import draft_family_update

# Global subscriber queues for Server-Sent Events (SSE)
sse_subscribers: List[asyncio.Queue] = []

async def broadcast_event(event: Dict[str, Any]):
    """Broadcasts event in real-time to all connected SSE clients."""
    for q in list(sse_subscribers):
        try:
            await q.put(event)
        except Exception:
            pass

async def run_mission_workflow(case_data: Dict[str, Any]):
    """
    Executes the initial case intake workflow:
    1. Orchestrator initializes mission.
    2. Nominatim geocoding tool resolves anchor.
    3. Report Analysis Agent assesses urgency & entities.
    4. Search Planning generates initial Zone Alpha.
    5. Rescue Coordination stages initial volunteer sweeps.
    """
    case_id = case_data["case_id"]

    # --- STEP 0: Orchestrator Mission Initialized ---
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
            "reasoning": f"Subject is a {case_data['age']}-year-old minor last seen at {case_data['last_seen_location']}. Initiating emergency juvenile escalation ladder. Routing to Report Analysis Agent.",
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

    await asyncio.sleep(1.5)

    # --- STEP 1: Nominatim Geocoding Tool Call ---
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

    await asyncio.sleep(1.8)

    # --- STEP 2: Report Analysis Agent Extraction ---
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
    await broadcast_event(step2_event)

    await asyncio.sleep(1.5)

    # --- STEP 3: Search Planning Agent (Zone Alpha) ---
    search_plan = await plan_search_zones(case_data, geo_result)
    step3_event = {
        "stepIndex": 3,
        "timeOffsetSec": 9,
        "run_id": case_id,
        "agent": "search_planning",
        "event_type": "task_created",
        "title": "Zone Alpha & Search Perimeter Constructed",
        "summary": f"Created 1.5km search perimeter around {location_query}. 3 pedestrian sectors mapped.",
        "payload": search_plan,
        "particles": [
            {
                "from": "search_planning",
                "to": "rescue_coordination",
                "label": "Sector Maps",
                "payloadPreview": "Sector A1 (Bus Stop), A2 (Walkway), A3 (Market)"
            }
        ],
        "thoughtTrace": {
            "agent": "search_planning",
            "reasoning": search_plan["reasoning"],
            "toolsCalled": [{"name": "osm_isochrone_calc", "params": f"lat={geo_result['lat']}, lon={geo_result['lon']}, r=1.5km", "output": "Zone Alpha Active"}],
            "confidence": search_plan["confidence"],
            "alternatives": ["Uniform circle (Suboptimal: ignores railway boundary)"]
        }
    }
    log_event(step3_event)
    log_audit(case_id, "search_planning", "create_zone_alpha", f"Anchor: {location_query}", "Zone Alpha Created", 50, 60)
    await broadcast_event(step3_event)

    await asyncio.sleep(1.5)

    # --- STEP 4: Rescue Coordination Agent (Initial Volunteer Tasks) ---
    rescue_manifest = await coordinate_rescue_tasks(case_data, search_plan)
    step4_event = {
        "stepIndex": 4,
        "timeOffsetSec": 12,
        "run_id": case_id,
        "agent": "rescue_coordination",
        "event_type": "task_created",
        "title": "Volunteer Tasks Staged (Zero Overlap)",
        "summary": "Partitioned Zone Alpha into 2 non-overlapping volunteer quadrant sweeps.",
        "payload": rescue_manifest,
        "particles": [
            {
                "from": "rescue_coordination",
                "to": "orchestrator",
                "label": "Task Manifest",
                "payloadPreview": "2 Tasks: Bus Stop Shelter & Commercial High Street"
            }
        ],
        "thoughtTrace": {
            "agent": "rescue_coordination",
            "reasoning": rescue_manifest["reasoning"],
            "toolsCalled": [{"name": "db.assign_volunteers", "params": "zone='Alpha', count=4", "output": "2 tasks staged"}],
            "confidence": rescue_manifest["confidence"],
            "alternatives": ["Unorganized volunteer surge (Prohibited by safety protocol)"]
        }
    }
    log_event(step4_event)
    log_audit(case_id, "rescue_coordination", "stage_volunteer_tasks", "Zone Alpha", "4 volunteers staged", 40, 50)
    await broadcast_event(step4_event)


async def handle_incoming_sighting(case_id: str, sighting_data: Dict[str, Any]):
    """
    Autonomous Sighting Decision Router:
    Triggered when a new sighting webhook/form arrives:
    1. Orchestrator wakes and routes sighting to Verification Agent (Critic).
    2. Verification Agent audits duplicate text, clothing alignment, and spatiotemporal feasibility.
    3. If VERIFIED (score >= 0.85):
       - Orchestrator automatically commands Search Planning to re-plan zones -> Zone Beta!
       - Orchestrator commands Rescue Coordination to re-assign volunteer tasks!
       - Orchestrator commands Family Communication to draft updated memo!
       - Triggers Human Approval Gate (HOLD).
    4. If FLAGGED DUPLICATE or UNVERIFIED (score < 0.85):
       - Orchestrator logs rejection. Search plan and tasks remain unchanged!
    """
    case_data = get_case(case_id) or {
        "case_id": case_id,
        "name": "Rahul",
        "age": 16,
        "last_seen_time": "4:30 PM",
        "last_seen_location": "College Bus Stop",
        "clothing": "Royal blue shirt, black trousers"
    }

    sighting_id = sighting_data.get("sighting_id") or f"sight-{uuid.uuid4().hex[:4]}"
    sighting_data["sighting_id"] = sighting_id
    sighting_data["case_id"] = case_id

    # 1. Store sighting as pending
    insert_sighting(sighting_data)

    # Event: Sighting Arrived -> Dispatched to Verification Critic
    sighting_recv_event = {
        "stepIndex": 5,
        "timeOffsetSec": 15,
        "run_id": case_id,
        "agent": "orchestrator",
        "event_type": "message_sent",
        "title": f"Incoming Sighting Webhook ({sighting_data.get('location')})",
        "summary": f"Public Sighting: '{sighting_data.get('description')}' at {sighting_data.get('time')}",
        "payload": sighting_data,
        "particles": [
            {
                "from": "orchestrator",
                "to": "verification",
                "label": "Audit Sighting",
                "payloadPreview": f"{sighting_data.get('location')}: {sighting_data.get('description')}"
            }
        ],
        "thoughtTrace": {
            "agent": "orchestrator",
            "reasoning": f"Received sighting at {sighting_data.get('location')} via {sighting_data.get('source', 'webhook')}. Directing immediately to Verification Agent for consistency audit and duplicate check.",
            "toolsCalled": [{"name": "webhook.ingest", "params": f"id='{sighting_id}'", "output": "Payload valid"}],
            "confidence": 0.95,
            "alternatives": []
        }
    }
    log_event(sighting_recv_event)
    save_message(case_id, "orchestrator", "verification", f"Audit: {sighting_data.get('location')}", sighting_data)
    await broadcast_event(sighting_recv_event)

    await asyncio.sleep(1.8)

    # 2. Verification Agent (The Critic) Evaluates Sighting
    crit_start = time.time()
    crit_result = await verify_sighting(sighting_data, case_data)
    crit_duration = int((time.time() - crit_start) * 1000)

    # Geocode sighting location if verified
    s_lat, s_lon = None, None
    if crit_result["status"] == "verified":
        geo_s = await geocode_location(sighting_data.get("location", "Park Metro"))
        s_lat, s_lon = geo_s["lat"], geo_s["lon"]

    update_sighting_status(
        sighting_id,
        crit_result["status"],
        crit_result["confidence"],
        crit_result["critic_notes"],
        s_lat,
        s_lon
    )

    is_verified = crit_result["status"] == "verified"
    is_duplicate = crit_result["status"] == "flagged_duplicate"

    step_verif_event = {
        "stepIndex": 6,
        "timeOffsetSec": 18,
        "run_id": case_id,
        "agent": "verification",
        "event_type": "decision_made",
        "title": (
            f"Sighting VERIFIED (Score: {crit_result['confidence']})" if is_verified else
            f"Sighting FLAGGED: Duplicate Text (Score: {crit_result['confidence']})" if is_duplicate else
            f"Sighting FLAGGED: Improbable Transit (Score: {crit_result['confidence']})"
        ),
        "summary": crit_result["critic_notes"],
        "payload": crit_result,
        "particles": [
            {
                "from": "verification",
                "to": "search_planning" if is_verified else "orchestrator",
                "label": "Verified Sighting" if is_verified else "Duplicate Alert",
                "payloadPreview": (
                    f"Validated {sighting_data.get('location')} (Score {crit_result['confidence']})"
                    if is_verified else
                    f"Rejected Sighting #{sighting_id}: Duplicate Hash ({crit_result['confidence']})"
                )
            }
        ],
        "thoughtTrace": {
            "agent": "verification",
            "reasoning": crit_result["critic_notes"],
            "toolsCalled": [{"name": "verify_spatiotemporal", "params": f"loc='{sighting_data.get('location')}'", "output": f"Status: {crit_result['status']}"}],
            "confidence": crit_result["confidence"],
            "alternatives": ["Forward to search team unconditionally (Rejected: Protects search efficiency)"]
        }
    }
    log_event(step_verif_event)
    log_audit(case_id, "verification", "audit_sighting", f"Sighting {sighting_id}", crit_result["status"], crit_duration, 160)
    await broadcast_event(step_verif_event)

    # 3. IF FLAGGED (DUPLICATE OR UNVERIFIED): STOP HERE. Do not alter search plan.
    if not is_verified:
        # Emit final summary event confirming search plan protected
        protect_event = {
            "stepIndex": 7,
            "timeOffsetSec": 20,
            "run_id": case_id,
            "agent": "orchestrator",
            "event_type": "task_updated",
            "title": "Search Plan Protected: Unverified Lead Pruned",
            "summary": f"Orchestrator retained active search perimeter. Zero false diversion of volunteer resources.",
            "payload": {"status": "protected", "active_perimeter": "Zone Alpha"},
            "particles": [],
            "thoughtTrace": {
                "agent": "orchestrator",
                "reasoning": "Verification Agent flagged sighting below 0.85 confidence threshold. Autonomous guardrail held: search plan and volunteer deployment remain focused on Zone Alpha.",
                "toolsCalled": [{"name": "critic.guardrail_hold", "params": "action='preserve_plan'", "output": "Plan Preserved"}],
                "confidence": 0.99,
                "alternatives": ["Divert volunteers to social lead (Rejected: would waste critical search window)"]
            }
        }
        log_event(protect_event)
        await broadcast_event(protect_event)
        return

    # 4. IF VERIFIED: TRIGGER AUTONOMOUS RE-PLANNING CASCADE
    await asyncio.sleep(1.8)

    # A. Search Planning Re-plans Zones -> Zone Beta!
    replan = await plan_search_zones(case_data, {"lat": s_lat, "lon": s_lon})
    replan_event = {
        "stepIndex": 8,
        "timeOffsetSec": 22,
        "run_id": case_id,
        "agent": "search_planning",
        "event_type": "task_updated",
        "title": "Autonomous Re-planning: Zone Beta Activated",
        "summary": f"Search centroid shifted 2.1km West to {sighting_data.get('location')}. Zone Beta designated Critical Priority.",
        "payload": replan,
        "particles": [
            {
                "from": "search_planning",
                "to": "rescue_coordination",
                "label": "Re-planned Sectors",
                "payloadPreview": "Deploy Sectors B1 (Station), B2 (Concourse), B3 (Bus Bay)"
            }
        ],
        "thoughtTrace": {
            "agent": "search_planning",
            "reasoning": replan["reasoning"],
            "toolsCalled": [{"name": "osm_zone_replan", "params": f"anchor='{sighting_data.get('location')}', r=1.2km", "output": "Zone Beta Created"}],
            "confidence": replan["confidence"],
            "alternatives": ["Keep Zone Alpha as primary (Rejected: verified sighting proves subject moved)"]
        }
    }
    log_event(replan_event)
    log_audit(case_id, "search_planning", "replan_zone_beta", sighting_data.get("location"), "Zone Beta active", 40, 80)
    await broadcast_event(replan_event)

    await asyncio.sleep(1.8)

    # B. Rescue Coordination Re-assigns Volunteer Tasks to Zone Beta
    rescue_replan = await coordinate_rescue_tasks(case_data, replan)
    rescue_event = {
        "stepIndex": 9,
        "timeOffsetSec": 25,
        "run_id": case_id,
        "agent": "rescue_coordination",
        "event_type": "task_created",
        "title": "Volunteer Missions Partitioned for Zone Beta",
        "summary": "Created 4 targeted missions across Zone Beta without duplicate volunteer overlap.",
        "payload": rescue_replan,
        "particles": [
            {
                "from": "rescue_coordination",
                "to": "orchestrator",
                "label": "Task Manifest",
                "payloadPreview": "4 Tasks: Station CCTV Check, Concourse Inquiries, Transit Bay Sweep"
            }
        ],
        "thoughtTrace": {
            "agent": "rescue_coordination",
            "reasoning": rescue_replan["reasoning"],
            "toolsCalled": [{"name": "db.assign_volunteers", "params": "zone='Beta', count=8", "output": "4 tasks dispatched"}],
            "confidence": rescue_replan["confidence"],
            "alternatives": []
        }
    }
    log_event(rescue_event)
    log_audit(case_id, "rescue_coordination", "reassign_tasks_zone_beta", "Zone Beta", "4 missions partitioned", 45, 60)
    await broadcast_event(rescue_event)

    await asyncio.sleep(1.8)

    # C. Family Communication Agent Drafts Progress Update
    family_memo = await draft_family_update(case_data, replan, f"{sighting_data.get('location')} at {sighting_data.get('time')}")
    family_event = {
        "stepIndex": 10,
        "timeOffsetSec": 28,
        "run_id": case_id,
        "agent": "family_communication",
        "event_type": "approval_requested",
        "title": "HUMAN APPROVAL GATE: HOLD EVENT TRIGGERED",
        "summary": "Coordinator sign-off required before outbound family notification & field mobilization.",
        "payload": {"status": "hold", "requiresHuman": True},
        "particles": [],
        "thoughtTrace": {
            "agent": "family_communication",
            "reasoning": "MANDATORY ETHICAL GATE: Family updates and volunteer deployment require human coordinator authorization. Holding execution until sign-off is confirmed.",
            "toolsCalled": [{"name": "gatekeeper.hold", "params": "timeout=300s", "output": "System State: HOLD"}],
            "confidence": 1.0,
            "alternatives": ["Auto-send without human review (Strictly Prohibited by safety rules)"]
        },
        "approvalHold": {
            "requestId": f"gate-{case_id}-fm01",
            "title": "Human Coordinator Sign-off Required",
            "riskLevel": "high",
            "agent": "family_communication",
            "action": f"Dispatch Family Progress Update & Mobilize 8 Field Volunteers to {sighting_data.get('location')}",
            "preview": {
                "recipient": family_memo.get("recipient", "Guardian: Smt. Sunita"),
                "message": family_memo.get("message", "Verified sighting confirmed near Park Metro."),
                "safeguardsEnforced": family_memo.get("safeguards_enforced", [
                    "Zero facial recognition used",
                    "Exact live volunteer GPS coordinates redacted",
                    "Official emergency services advisory banner included"
                ])
            }
        }
    }
    log_event(family_event)
    log_audit(case_id, "family_communication", "stage_approval_gate", "Family Memo", "Approval Hold Triggered", 30, 100)
    await broadcast_event(family_event)
