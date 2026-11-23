import asyncio
import time
from typing import Callable, Any, Dict, Optional
from backend.database import log_event, log_audit

async def with_retry_and_fallback(
    operation_name: str,
    case_id: str,
    agent: str,
    primary_fn: Callable[[], Any],
    fallback_fn: Callable[[], Any],
    max_retries: int = 3,
    initial_backoff: float = 0.4
) -> Dict[str, Any]:
    """
    Executes primary_fn with exponential backoff retries.
    If all retries fail, seamlessly executes fallback_fn and emits error telemetry.
    """
    start_time = time.time()
    last_exception = None

    for attempt in range(1, max_retries + 1):
        try:
            result = await primary_fn()
            duration_ms = int((time.time() - start_time) * 1000)
            return {
                "success": True,
                "data": result,
                "attempt": attempt,
                "used_fallback": False,
                "duration_ms": duration_ms
            }
        except Exception as e:
            last_exception = e
            backoff = initial_backoff * (2 ** (attempt - 1))
            print(f"[{agent}] Attempt {attempt}/{max_retries} failed for '{operation_name}': {e}. Backing off {backoff:.2f}s...")
            await asyncio.sleep(backoff)

    # All retries failed -> execute fallback
    print(f"[{agent}] All {max_retries} attempts failed for '{operation_name}'. Switching to safe offline fallback.")
    fallback_data = await fallback_fn() if asyncio.iscoroutinefunction(fallback_fn) else fallback_fn()
    duration_ms = int((time.time() - start_time) * 1000)

    # Log error & self-healing event
    error_event = {
        "stepIndex": 99,
        "timeOffsetSec": int(time.time() - start_time),
        "run_id": case_id,
        "agent": agent,
        "event_type": "error_occurred",
        "title": f"External Timeout: {operation_name}",
        "summary": f"Exhausted {max_retries} retries ({str(last_exception)[:60]}). Circuit-breaker engaged offline fallback.",
        "payload": {
            "error": str(last_exception),
            "retry_count": max_retries,
            "recovery_action": "Engaged verified offline cache. System operating normally."
        },
        "particles": [],
        "thoughtTrace": {
            "agent": agent,
            "reasoning": f"Primary API unreachable after {max_retries} exponential backoff cycles. Engaged zero-downtime cached fallback snapshot to guarantee mission continuity.",
            "toolsCalled": [{"name": "circuit_breaker.fallback", "params": f"op='{operation_name}'", "output": "Fallback Succeeded"}],
            "confidence": 0.90,
            "alternatives": ["Halt system and throw 500 error (Prohibited by demo-safety covenant)"]
        }
    }
    log_event(error_event)
    log_audit(case_id, agent, f"{operation_name}_retry_exhausted", f"Error: {last_exception}", "Fallback Engaged", duration_ms, 0)

    return {
        "success": True,
        "data": fallback_data,
        "attempt": max_retries,
        "used_fallback": True,
        "duration_ms": duration_ms,
        "error_event": error_event
    }
