import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
DEMO_MODE = os.getenv("DEMO_MODE", "True").lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Visual Design Tokens & Agent Palette
AGENT_PALETTE = {
    "orchestrator": {
        "name": "Orchestrator",
        "title": "Mission Commander",
        "color": "#00F0FF",
        "secondary": "rgba(0, 240, 255, 0.2)",
        "description": "Blackboard scheduling, deadline priority, task orchestration"
    },
    "scout": {
        "name": "Scout",
        "title": "Portal & Eligibility Scanner",
        "color": "#00FF9D",
        "secondary": "rgba(0, 255, 157, 0.2)",
        "description": "Scrapes target portals, detects changes via hashes, checks criteria"
    },
    "drafter": {
        "name": "Drafter",
        "title": "Synthesis & Essay Architect",
        "color": "#A855F7",
        "secondary": "rgba(168, 85, 247, 0.2)",
        "description": "Synthesizes student profile with opportunity criteria into tailored packets"
    },
    "critic": {
        "name": "Critic",
        "title": "Adversarial Quality Auditor",
        "color": "#FFB800",
        "secondary": "rgba(255, 184, 0, 0.2)",
        "description": "Scores rubric alignment, hallucination detection; triggers re-draft loop"
    },
    "courier": {
        "name": "Courier",
        "title": "Dispatcher & Gatekeeper",
        "color": "#FF007A",
        "secondary": "rgba(255, 0, 122, 0.2)",
        "description": "Generates PDF application & .ics calendar file, gates human approval"
    }
}
