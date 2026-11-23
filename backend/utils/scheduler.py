import asyncio
import time
from datetime import datetime
from typing import Optional
from backend.database import get_active_cases, get_tasks, log_event, log_audit
from backend.agents.orchestrator import broadcast_event

_monitoring_task: Optional[asyncio.Task] = None
_is_monitoring_active = False

async def case_monitoring_patrol_loop(interval_sec: int = 25):
    """
    Autonomous Case Monitoring Loop:
    Periodically audits real active cases on the blackboard:
    1. Reads active cases dynamically from SQLite database.
    2. Audits volunteer tasks and flags tasks whose updated_at exceeds threshold.
    3. Computes summary strictly from live task counts without speculative phone tracking.
    """
    global _is_monitoring_active
    _is_monitoring_active = True
    patrol_count = 0

    print("[Case Monitor] Autonomous patrol loop started.")

    while _is_monitoring_active:
        try:
            await asyncio.sleep(interval_sec)
            patrol_count += 1

            # Fetch real active cases from database
            active_cases = get_active_cases()
            if not active_cases:
                continue

            for case in active_cases:
                case_id = case["case_id"]
                tasks = get_tasks(case_id)
                if not tasks:
                    continue

                total_tasks = len(tasks)
                pending_count = sum(1 for t in tasks if t["status"] == "pending")
                in_progress_count = sum(1 for t in tasks if t["status"] == "in_progress")
                completed_count = sum(1 for t in tasks if t["status"] == "completed")

                # Detect stale tasks: pending or in_progress with updated_at older than 180 seconds
                now = datetime.utcnow()
                stale_tasks = []
                for t in tasks:
                    if t["status"] in ["pending", "in_progress"]:
                        time_str = t.get("updated_at") or t.get("created_at")
                        if time_str:
                            try:
                                clean_time = time_str.replace("Z", "").split(".")[0]
                                t_dt = datetime.fromisoformat(clean_time)
                                if (now - t_dt).total_seconds() > 180:
                                    stale_tasks.append(t["title"])
                            except Exception:
                                pass

                # Dynamic summary and reasoning computed strictly from real counts
                if stale_tasks:
                    summary = (
                        f"Case monitor audit: {total_tasks} tasks tracked ({in_progress_count} active, "
                        f"{completed_count} completed). Flagged {len(stale_tasks)} stale task(s) awaiting progress."
                    )
                    reasoning = (
                        f"Autonomous monitor identified {len(stale_tasks)} stalled assignment(s): "
                        f"{', '.join(stale_tasks[:2])}. Recommending field status check by rescue team lead."
                    )
                else:
                    summary = (
                        f"Case monitor audit: {total_tasks} tasks tracked ({in_progress_count} active, "
                        f"{completed_count} completed, {pending_count} pending). All assignments on schedule."
                    )
                    reasoning = (
                        f"Autonomous case patrol verified {total_tasks} volunteer assignments across active sectors. "
                        f"All tasks updated within expected operational windows."
                    )

                patrol_event = {
                    "stepIndex": 13,
                    "timeOffsetSec": patrol_count * interval_sec,
                    "run_id": case_id,
                    "agent": "orchestrator",
                    "event_type": "task_updated",
                    "title": f"Autonomous Case Patrol #{patrol_count}",
                    "summary": summary,
                    "payload": {
                        "patrol_cycle": patrol_count,
                        "case_id": case_id,
                        "total_tasks": total_tasks,
                        "pending": pending_count,
                        "in_progress": in_progress_count,
                        "completed": completed_count,
                        "stale_tasks_count": len(stale_tasks)
                    },
                    "particles": [],
                    "thoughtTrace": {
                        "agent": "orchestrator",
                        "reasoning": reasoning,
                        "toolsCalled": [{"name": "db.audit_stale_tasks", "params": f"case_id='{case_id}', threshold=180s", "output": f"Stale: {len(stale_tasks)}"}],
                        "confidence": 0.98,
                        "alternatives": []
                    }
                }

                log_event(patrol_event)
                log_audit(case_id, "orchestrator", "scheduled_patrol", f"Cycle {patrol_count}", summary, 25, 40)
                await broadcast_event(patrol_event)

        except asyncio.CancelledError:
            print("[Case Monitor] Patrol loop cancelled.")
            break
        except Exception as e:
            print(f"[Case Monitor] Patrol error: {e}")

def start_scheduler():
    global _monitoring_task
    if _monitoring_task is None or _monitoring_task.done():
        _monitoring_task = asyncio.create_task(case_monitoring_patrol_loop(interval_sec=25))

def stop_scheduler():
    global _is_monitoring_active, _monitoring_task
    _is_monitoring_active = False
    if _monitoring_task and not _monitoring_task.done():
        _monitoring_task.cancel()
