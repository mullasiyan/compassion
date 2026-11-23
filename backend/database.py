import os
import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_DIR = Path(__file__).parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "lostlink.db"
SCHEMA_PATH = Path(__file__).parent / "schema.sql"

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite tables."""
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    with get_db() as conn:
        conn.executescript(schema_sql)
        conn.commit()

# --- Blackboard: Case Helpers ---

def insert_case(case_data: Dict[str, Any]):
    with get_db() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO cases (case_id, name, age, last_seen_time, last_seen_location, clothing, details_json, urgency, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')""",
            (
                case_data["case_id"],
                case_data["name"],
                case_data["age"],
                case_data["last_seen_time"],
                case_data["last_seen_location"],
                case_data.get("clothing", "Unspecified"),
                json.dumps(case_data.get("details", {})),
                case_data.get("urgency", "CRITICAL" if case_data.get("age", 25) < 18 else "HIGH")
            )
        )
        conn.commit()

def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,)).fetchone()
        if not row:
            return None
        return {
            "case_id": row["case_id"],
            "name": row["name"],
            "age": row["age"],
            "last_seen_time": row["last_seen_time"],
            "last_seen_location": row["last_seen_location"],
            "clothing": row["clothing"],
            "details": json.loads(row["details_json"] or "{}"),
            "urgency": row["urgency"],
            "status": row["status"],
            "created_at": row["created_at"]
        }

def get_active_cases() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM cases WHERE status = 'active' ORDER BY created_at DESC").fetchall()
        return [
            {
                "case_id": r["case_id"],
                "name": r["name"],
                "age": r["age"],
                "last_seen_time": r["last_seen_time"],
                "last_seen_location": r["last_seen_location"],
                "clothing": r["clothing"],
                "details": json.loads(r["details_json"] or "{}"),
                "urgency": r["urgency"],
                "status": r["status"],
                "created_at": r["created_at"]
            }
            for r in rows
        ]

# --- Blackboard: Task Helpers ---

def create_task(task_id: str, case_id: str, title: str, assigned_to: str, priority: str = "medium"):
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO tasks (task_id, case_id, title, assigned_to, status, priority, progress) VALUES (?, ?, ?, ?, 'pending', ?, 0.0)",
            (task_id, case_id, title, assigned_to, priority)
        )
        conn.commit()

def update_task(task_id: str, status: str, progress: float = 0.0):
    with get_db() as conn:
        conn.execute(
            "UPDATE tasks SET status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?",
            (status, progress, task_id)
        )
        conn.commit()

def get_tasks(case_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM tasks WHERE case_id = ? ORDER BY created_at ASC", (case_id,)).fetchall()
        return [dict(r) for r in rows]

# --- Blackboard: Message & Particle Helpers ---

def save_message(case_id: str, from_agent: str, to_agent: str, preview: str, full_payload: Dict[str, Any] = None):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO messages (case_id, from_agent, to_agent, payload_preview, payload_json) VALUES (?, ?, ?, ?, ?)",
            (case_id, from_agent, to_agent, preview, json.dumps(full_payload or {}))
        )
        conn.commit()

# --- Blackboard: Sightings Helpers (Verification & Critic) ---

def insert_sighting(sighting: Dict[str, Any]):
    with get_db() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO sightings 
               (sighting_id, case_id, source, location, time, description, lat, lon, status, confidence, critic_notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                sighting["sighting_id"],
                sighting["case_id"],
                sighting.get("source", "community_webhook"),
                sighting["location"],
                sighting["time"],
                sighting["description"],
                sighting.get("lat"),
                sighting.get("lon"),
                sighting.get("status", "pending"),
                sighting.get("confidence", 0.0),
                sighting.get("critic_notes", "")
            )
        )
        conn.commit()

def update_sighting_status(sighting_id: str, status: str, confidence: float, critic_notes: str, lat: float = None, lon: float = None):
    with get_db() as conn:
        if lat is not None and lon is not None:
            conn.execute(
                """UPDATE sightings 
                   SET status = ?, confidence = ?, critic_notes = ?, lat = ?, lon = ?
                   WHERE sighting_id = ?""",
                (status, confidence, critic_notes, lat, lon, sighting_id)
            )
        else:
            conn.execute(
                """UPDATE sightings 
                   SET status = ?, confidence = ?, critic_notes = ?
                   WHERE sighting_id = ?""",
                (status, confidence, critic_notes, sighting_id)
            )
        conn.commit()

def get_sightings(case_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM sightings WHERE case_id = ? ORDER BY created_at ASC", (case_id,)).fetchall()
        return [dict(r) for r in rows]

def get_verified_sightings(case_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM sightings WHERE case_id = ? AND status = 'verified' ORDER BY confidence DESC", (case_id,)).fetchall()
        return [dict(r) for r in rows]

# --- Blackboard: Search Zones Helpers (Spatial Modeling) ---

def upsert_search_zone(zone: Dict[str, Any]):
    with get_db() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO search_zones 
               (zone_id, case_id, name, center_lat, center_lon, radius_m, priority, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                zone["zone_id"],
                zone["case_id"],
                zone["name"],
                zone["center_lat"],
                zone["center_lon"],
                zone["radius_m"],
                zone["priority"],
                zone.get("status", "active")
            )
        )
        conn.commit()

def get_search_zones(case_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM search_zones WHERE case_id = ? ORDER BY priority DESC", (case_id,)).fetchall()
        return [dict(r) for r in rows]

# --- Blackboard: Approval Gates ---

def create_approval(request_id: str, case_id: str, agent: str, action: str, risk_level: str, payload: Dict[str, Any]):
    with get_db() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO approvals (request_id, case_id, agent, action, risk_level, payload_json, status)
               VALUES (?, ?, ?, ?, ?, ?, 'pending')""",
            (request_id, case_id, agent, action, risk_level, json.dumps(payload))
        )
        conn.commit()

def resolve_approval(request_id: str, status: str, decided_by: str, edited_payload: Dict[str, Any] = None):
    with get_db() as conn:
        if edited_payload:
            conn.execute(
                """UPDATE approvals 
                   SET status = ?, decided_by = ?, payload_json = ?, decided_at = CURRENT_TIMESTAMP 
                   WHERE request_id = ?""",
                (status, decided_by, json.dumps(edited_payload), request_id)
            )
        else:
            conn.execute(
                """UPDATE approvals 
                   SET status = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP 
                   WHERE request_id = ?""",
                (status, decided_by, request_id)
            )
        conn.commit()

def get_pending_approvals(case_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM approvals WHERE case_id = ? AND status = 'pending'", (case_id,)).fetchall()
        return [dict(r) for r in rows]

def get_approvals(case_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM approvals WHERE case_id = ? ORDER BY created_at DESC", (case_id,)).fetchall()
        return [dict(r) for r in rows]

# --- Blackboard: Notifications ---

def insert_notification(case_id: str, recipient: str, channel: str, subject: str, message: str, status: str = 'staged') -> int:
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO notifications (case_id, recipient, channel, subject, message, status)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (case_id, recipient, channel, subject, message, status)
        )
        conn.commit()
        return cursor.lastrowid

def dispatch_notification(notif_id: int):
    with get_db() as conn:
        conn.execute(
            "UPDATE notifications SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?",
            (notif_id,)
        )
        conn.commit()

def get_notifications(case_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM notifications WHERE case_id = ? ORDER BY created_at DESC", (case_id,)).fetchall()
        return [dict(r) for r in rows]

# --- Blackboard: Event Stream & Audit Helpers ---

def log_event(event_dict: Dict[str, Any]):
    """Records event matching the exact frontend ScriptedEvent shape."""
    with get_db() as conn:
        conn.execute(
            """INSERT INTO events 
               (case_id, step_index, time_offset_sec, agent, event_type, title, summary, payload_json, particles_json, thought_trace_json, approval_hold_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                event_dict.get("run_id") or event_dict.get("case_id"),
                event_dict.get("stepIndex", 0),
                event_dict.get("timeOffsetSec", 0),
                event_dict.get("agent", "system"),
                event_dict.get("event_type"),
                event_dict.get("title", ""),
                event_dict.get("summary", ""),
                json.dumps(event_dict.get("payload", {})),
                json.dumps(event_dict.get("particles", [])),
                json.dumps(event_dict.get("thoughtTrace")) if event_dict.get("thoughtTrace") else None,
                json.dumps(event_dict.get("approvalHold")) if event_dict.get("approvalHold") else None
            )
        )
        conn.commit()

def log_audit(case_id: str, agent: str, action: str, input_summary: str, output_summary: str, duration_ms: int = 0, tokens_used: int = 0):
    with get_db() as conn:
        conn.execute(
            """INSERT INTO audit_log (case_id, agent, action, input_summary, output_summary, duration_ms, tokens_used)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (case_id, agent, action, input_summary, output_summary, duration_ms, tokens_used)
        )
        conn.commit()

def get_events_by_case(case_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM events WHERE case_id = ? ORDER BY step_index ASC, id ASC", (case_id,)).fetchall()
        result = []
        for r in rows:
            result.append({
                "stepIndex": r["step_index"],
                "timeOffsetSec": r["time_offset_sec"],
                "run_id": r["case_id"],
                "agent": r["agent"],
                "event_type": r["event_type"],
                "title": r["title"],
                "summary": r["summary"],
                "payload": json.loads(r["payload_json"] or "{}"),
                "particles": json.loads(r["particles_json"] or "[]"),
                "thoughtTrace": json.loads(r["thought_trace_json"]) if r["thought_trace_json"] else None,
                "approvalHold": json.loads(r["approval_hold_json"]) if r["approval_hold_json"] else None,
                "timestamp": r["timestamp"]
            })
        return result

if __name__ == "__main__":
    init_db()
    print("LostLink SQLite database initialized with Step 6 approvals and notifications.")
