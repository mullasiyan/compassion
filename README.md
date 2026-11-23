# LostLink - Multi-Agent Search & Rescue Coordination

Multi-agent AI system that analyses missing-person reports, verifies sightings,
plans search zones and coordinates volunteers, with human approval at every
critical step. All demo data is fictional.

## Quickstart

### Backend
    cd d:\hackathon
    python -m venv backend\venv
    backend\venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
    python -m uvicorn backend.main:app --reload --port 8000

### Frontend
    cd frontend
    npm install
    npm run dev

Open http://localhost:5173

## Status
Work in progress. Full setup guide, architecture and demo steps coming soon.