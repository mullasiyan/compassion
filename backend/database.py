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

def insert_case(case_data: Dict[str, Any]):
    with get_db() as conn:
        conn.execute(
            """INSERT INTO cases (case_id, name, age, last_seen_time, last_seen_location, clothing, details_json, urgency, status)
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

def create_task(task_id: str, case_id: str, title: str, assigned_to: str, priority: str = "medium"):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO tasks (task_id, case_id, title, assigned_to, status, priority, progress) VALUES (?, ?, ?, ?, 'pending', ?, 0.0)",
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

def save_message(case_id: str, from_agent: str, to_agent: str, preview: str, full_payload: Dict[str, Any] = None):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO messages (case_id, from_agent, to_agent, payload_preview, payload_json) VALUES (?, ?, ?, ?, ?)",
            (case_id, from_agent, to_agent, preview, json.dumps(full_payload or {}))
        )
        conn.commit()

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
    print("LostLink SQLite database initialized.")
