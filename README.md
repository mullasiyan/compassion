# LostLink — Autonomous AI Search & Rescue Coordination Network

> **Hackathon Track:** Multi-Agent Autonomy ("Agents that get real work done")  
> **Mission:** When a missing-person report is submitted, a coordinated swarm of 6 specialized AI agents analyzes the case, verifies incoming sightings, dynamically re-plans search perimeters, coordinates authorized volunteers, and drafts family updates behind mandatory human approval gates.

---

## 🌌 The Agent Observatory UI

LostLink's frontend is a dark, cinematic mission-control center designed as a living organism:
- **Constellation Canvas:** 6 agent orbs glowing in deep space with physics-driven motion states (idle breathing glow, thinking ripple rings, working orbiting particles, failed red crack, and done radiance).
- **Curved Message Particles:** Glowing data particles travel between orbs with hover tooltips showing payload telemetry.
- **Thought Trace Drawer:** Typewriter reasoning, confidence gauges, tool execution logs, and discarded alternatives for every agent.
- **Dynamic Leaflet + OpenStreetMap Map:** Real-time spatial search zones (Zone Alpha $\to$ Zone Beta) rendered on CartoDB Dark Matter tiles.
- **Human Approval Gate (HOLD):** Canvas dims, the agent orb freezes with an amber pulsing halo, and a glass card allows coordinators to **Approve**, **Edit**, or **Reject** outbound actions.
- **Scrubbable Timeline Ribbon:** Video-editor scrub bar to replay or scrub through the entire autonomous run.
- **Command Palette (`Ctrl+K`):** Instant search, sighting webhook triggers, and failure simulation.

---

## 🤖 The 6-Agent Swarm

| Agent | Signature Color | Role Title | Core Autonomy Responsibility |
| :--- | :--- | :--- | :--- |
| **1. Orchestrator** | `#00F0FF` Electric Cyan | Mission Commander | State router, task scheduler, autonomous re-planner on verified signals. |
| **2. Report Analysis** | `#38BDF8` Sky Cyan | Intake & Urgency Screener | Extracts entities via Gemini, scores juvenile urgency (`88/100`), calls Nominatim. |
| **3. Verification (Critic)** | `#FFB800` Amber Gold | Sighting & Rubric Auditor | Filters text duplicate hashes & improbable transit velocity; enforces `<0.85` reject gate. |
| **4. Search Planning** | `#A855F7` Ultra Violet | Spatial Zone Strategist | Computes 1.5km isochrone perimeter; auto-shifts centroid to Zone Beta on verified sighting. |
| **5. Rescue Coordination** | `#00FF9D` Emerald Lime | Field & Volunteer Dispatcher | Partitions active zones into 4 non-overlapping volunteer sweeps with zero duplicate coverage. |
| **6. Family Communication**| `#FF007A` Hyper Magenta| Guardian Liaison Gatekeeper | Drafts empathetic updates with live GPS coordinates redacted; holds for coordinator sign-off. |

---

## 🏗️ System Architecture

```
                      [External Triggers]
              (Form / Webhook / Scheduled Patrol)
                               │
                               ▼
            ┌──────────────────────────────────────┐
            │       FastAPI Gateway (Port 8000)    │
            └──────────────────┬───────────────────┘
                               │
           ┌───────────────────▼───────────────────┐
           │        ORCHESTRATOR AGENT             │
           │  (Blackboard Router & Decision Engine) │
           └─────────┬───────────────────▲─────────┘
                     │                   │
      ┌──────────────┼───────────────────┼──────────────┐
      ▼              ▼                   ▼              ▼
[Report Analysis]  [Verification]  [Search Planning] [Rescue Coord]
  (Gemini + OSM)   (The Critic)      (Zone Beta)     (Volunteers)
                     │                   │              │
                     └─────────┬─────────┘              │
                               ▼                        ▼
                   [Family Communication]   [Approval HOLD Gate]
                     (Redaction Shield)     (Human Sign-off)
                               │                        │
                               └───────────┬────────────┘
                                           ▼
                                 [Live SSE Event Stream]
                                           │
                                           ▼
                               [Observatory Frontend]
                        (Canvas Orbs + Leaflet Map + Audio)
```

---

## ⚡ Quickstart & Setup (Windows)

### Prerequisites
- Python 3.10+ installed
- Node.js v18+ and npm installed

### 1. Backend Setup
Open a terminal in the project root:
```powershell
cd D:\hackathon

# Create and activate virtual environment
python -m venv backend\venv
backend\venv\Scripts\activate

# Install pinned dependencies
pip install -r backend\requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn backend.main:app --reload --port 8000
```
*Health Check: `http://localhost:8000/api/health`*

### 2. Frontend Setup
Open a second terminal:
```powershell
cd D:\hackathon\frontend

# Install dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```
*Observatory Dashboard: `http://localhost:5173`*

---

## ⚙️ Environment Configuration (`.env`)

Copy `.env.example` in `backend/`:
```bash
# Optional: Live Gemini Flash API Key (if omitted, high-fidelity cached snapshots activate)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenStreetMap Nominatim User Agent (Complies with OSM Usage Policy)
NOMINATIM_USER_AGENT=LostLink-SearchRescue/1.0 (contact: info@lostlink.org)
```
> **Demo-Safety Guarantee:** LostLink includes comprehensive cached fallbacks. If no API key is provided, or if the Wi-Fi drops, every agent, tool, and calculation runs flawlessly with seeded, verified data.

---

## 🛡️ Safety & Ethical Covenant

LostLink enforces non-negotiable safety guardrails directly inside code:
1. **Zero Facial Recognition:** Matching is strictly text-based (descriptions, timeline, and spatial vectors). Image similarity and facial scans are strictly prohibited.
2. **Zero Phone/Device Tracking:** The system never implies or performs cellular or GPS tracking of individuals. Anchors are derived solely from verified witness reports.
3. **Privacy Redaction Shield:** Live GPS coordinates of volunteer searchers and tactical details are automatically stripped before drafting family progress memos.
4. **Mandatory Human-in-the-Loop:** AI agents can **never** declare a person found or close a case. All volunteer deployments and family dispatches pause at an approval gate until a human coordinator signs off.
5. **Emergency Mandate:** A prominent advisory banner is permanently rendered: *"Contact police or emergency services immediately. LostLink supports, and does not replace, official channels."*
6. **Immutable Audit Trail:** Every agent thought, tool call, verification score, and human decision is logged to SQLite `audit_log`.

---

## 🎬 4-Minute Demo Script (The Sighting Webhook Moment)

- **0:00 - 0:45 | The Crisis & Intake:**
  - Introduce Rahul (16), last seen at 4:30 PM at College Bus Stop.
  - Explain why minutes matter: approaching nightfall and minor status trigger Critical Priority.
  - Click **"LAUNCH AGENT OBSERVATORY"**.
- **0:45 - 1:45 | Swarm Ingestion & Spatial Modeling:**
  - Watch the Orchestrator wake Report Analysis.
  - Point out the **real OpenStreetMap Nominatim geocoding** tool resolving coordinates `(17.3850, 78.4867)`.
  - Search Planning establishes **Zone Alpha (1.5km pedestrian isochrone)** on the Rescue Team Leaflet map.
  - 2 volunteer sweeps are staged with zero duplicate coverage.
- **1:45 - 2:45 | The Sighting Webhook & Critic Re-planning (Climax):**
  - Switch to the **Rescue Team** console or use the Webhook Simulator.
  - **Fire Sighting #2 (Duplicate Social Post):** Watch the Verification Critic score it `0.15` and discard it. The search plan remains protected from false alarms.
  - **Fire Sighting #1 (Park Metro - 5:15 PM):** Witness the Verification Critic evaluate transit feasibility (`2.8 km/h` walking pace) and score it `0.92`.
  - **Autonomous Cascade:** Search Planning immediately shifts the centroid 2.1km West, spawning **Zone Beta** as Critical Priority on the Leaflet map and partitioning 4 new volunteer missions.
- **2:45 - 3:30 | The Human Approval Gate (HOLD Event):**
  - The constellation dims, and the Family Liaison orb freezes with a glowing amber halo.
  - Show the **Approval Gate modal**: highlight the drafted family memo, the privacy redaction check, and the coordinator override controls.
  - Click **"Edit Text"** or click **"Approve & Mobilize"**. The hold is released, volunteer tasks mobilize, and an encrypted memo dispatches to the Guardian Portal.
- **3:30 - 4:00 | Analytics & PDF Dossier:**
  - Open **"📊 Analytics & PDF"**: review real-time database metrics (verified vs flagged sightings, time to first zone, volunteer task assignments, and active search zones).
  - Click **"📄 Download PDF Case Dossier"** to generate the official ReportLab incident dossier with coordinator sign-off status.

---

## 🧠 Judge Q&A Guide

**Q1: Why did you prohibit facial recognition and device tracking?**  
*Answer:* In missing-person crises, facial recognition creates severe privacy risks, false matches, and ethical liabilities for volunteers. LostLink focuses on high-speed spatiotemporal correlation and text matching. It coordinates community volunteers without ever becoming a surveillance dragnet.

**Q2: How does the system handle fake or malicious sightings?**  
*Answer:* Every sighting passes through the Verification Agent (Critic). It enforces two deterministic filters before any LLM call: exact text MD5 hashing (catching viral social reposts) and pedestrian velocity physics (rejecting impossible transit distances). Sightings scoring below 0.85 are permanently barred from altering search zones.

**Q3: What happens if the Gemini API or network goes down on stage?**  
*Answer:* LostLink implements a circuit-breaker with exponential backoff (0.4s, 0.8s, 1.6s). If the API is unreachable, it automatically falls back to verified cached snapshots and logs an `error_occurred` self-healing event. Demo Mode uses cached fallbacks to provide offline resilience when external APIs are unavailable.

**Q4: How do the agents coordinate without race conditions?**  
*Answer:* All agents communicate through a centralized SQLite "blackboard" (`cases`, `tasks`, `sightings`, `search_zones`). The Orchestrator manages state progression and dependencies; worker agents read their assigned tasks and write results back to the shared blackboard, driving the visual particle network.
