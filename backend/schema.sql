-- ====================================================================
-- LostLink SQLite Blackboard Database Schema (Step 5 Multi-Agent)
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Missing Person Cases
CREATE TABLE IF NOT EXISTS cases (
    case_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    last_seen_time TEXT NOT NULL,
    last_seen_location TEXT NOT NULL,
    clothing TEXT NOT NULL,
    details_json TEXT DEFAULT '{}',
    urgency TEXT DEFAULT 'HIGH',
    status TEXT NOT NULL CHECK(status IN ('active', 'review', 'resolved', 'closed')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Blackboard Tasks
CREATE TABLE IF NOT EXISTS tasks (
    task_id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    title TEXT NOT NULL,
    assigned_to TEXT NOT NULL, -- orchestrator, report_analysis, verification, search_planning, rescue_coordination, family_communication
    status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
    progress REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

-- 3. Agent Messages (Drives Visual Message Particles)
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    payload_preview TEXT NOT NULL,
    payload_json TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

-- 4. Unified Event Log (Matches Frontend ScriptedEvent Contract)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    step_index INTEGER NOT NULL DEFAULT 0,
    time_offset_sec INTEGER NOT NULL DEFAULT 0,
    agent TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    payload_json TEXT DEFAULT '{}',
    particles_json TEXT DEFAULT '[]',
    thought_trace_json TEXT DEFAULT NULL,
    approval_hold_json TEXT DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

-- 5. Audit Log (Ethical Safety & Action Trace)
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    action TEXT NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    duration_ms INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

-- 6. Sightings Blackboard (Raw & Verified Sightings)
CREATE TABLE IF NOT EXISTS sightings (
    sighting_id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    source TEXT NOT NULL,
    location TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT NOT NULL,
    lat REAL,
    lon REAL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'verified', 'flagged_duplicate', 'flagged_unverified')) DEFAULT 'pending',
    confidence REAL DEFAULT 0.0,
    critic_notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

-- 7. Search Zones (Dynamic Spatial Perimeters)
CREATE TABLE IF NOT EXISTS search_zones (
    zone_id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    name TEXT NOT NULL,
    center_lat REAL NOT NULL,
    center_lon REAL NOT NULL,
    radius_m INTEGER NOT NULL,
    priority TEXT NOT NULL CHECK(priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL CHECK(status IN ('active', 'decayed', 'cleared')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES cases(case_id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id);
CREATE INDEX IF NOT EXISTS idx_events_case_id ON events(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_case_id ON audit_log(case_id);
CREATE INDEX IF NOT EXISTS idx_sightings_case_id ON sightings(case_id);
CREATE INDEX IF NOT EXISTS idx_zones_case_id ON search_zones(case_id);
