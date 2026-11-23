import { AgentRole, AgentMetadata, ScriptedEvent } from '../types';

export const AGENT_REGISTRY: Record<AgentRole, AgentMetadata> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator',
    roleTitle: 'Mission Commander',
    color: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    xPercent: 50,
    yPercent: 48,
    description: 'Blackboard manager, autonomous re-planner, priority triage, escalation router.'
  },
  report_analysis: {
    id: 'report_analysis',
    name: 'Report Analysis',
    roleTitle: 'Intake & Urgency Screener',
    color: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    xPercent: 20,
    yPercent: 28,
    description: 'Structures incoming report, extracts clues, detects missing info, evaluates urgency.'
  },
  verification: {
    id: 'verification',
    name: 'Verification Agent',
    roleTitle: 'Critic & Sighting Auditor',
    color: '#FFB800',
    glowColor: 'rgba(255, 184, 0, 0.4)',
    xPercent: 80,
    yPercent: 28,
    description: 'Adversarial fact auditor; filters duplicates & false sightings; enforces <0.85 loop.'
  },
  search_planning: {
    id: 'search_planning',
    name: 'Search Planning',
    roleTitle: 'Spatial Zone Strategist',
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    xPercent: 18,
    yPercent: 72,
    description: 'Computes probability density zones, timeline extrapolation, and map coordinates.'
  },
  rescue_coordination: {
    id: 'rescue_coordination',
    name: 'Rescue Coordination',
    roleTitle: 'Volunteer & Task Dispatcher',
    color: '#00FF9D',
    glowColor: 'rgba(0, 255, 157, 0.4)',
    xPercent: 50,
    yPercent: 88,
    description: 'Partitions zones into volunteer tasks, prevents duplicate search coverage, tracks safety.'
  },
  family_communication: {
    id: 'family_communication',
    name: 'Family Liaison',
    roleTitle: 'Verified Communications Gate',
    color: '#FF007A',
    glowColor: 'rgba(255, 0, 122, 0.4)',
    xPercent: 82,
    yPercent: 72,
    description: 'Drafts calm, fact-checked progress updates without exposing operational sensitivities.'
  }
};

export const SCRIPTED_RAHUL_DEMO: ScriptedEvent[] = [
  {
    stepIndex: 0,
    timeOffsetSec: 0,
    run_id: 'run-rahul-0921',
    agent: 'orchestrator',
    event_type: 'agent_status_changed',
    title: 'Mission Initialized: Rahul (Age 16)',
    summary: 'New missing juvenile report ingested. High priority protocol activated.',
    payload: { status: 'thinking' },
    particles: [
      { from: 'orchestrator', to: 'report_analysis', label: 'Dispatched Intake', payloadPreview: 'Raw Report: Rahul, 16, Blue Shirt, College Bus Stop' }
    ],
    thoughtTrace: {
      agent: 'orchestrator',
      reasoning: 'Subject is a 16-year-old minor last seen at 4:30 PM. Elapsed time: 3.5 hours. Initiating emergency juvenile escalation ladder. Routing raw report to Report Analysis agent for parsing.',
      toolsCalled: [{ name: 'db.create_mission', params: 'case_id="rahul-16", priority="critical"', output: 'OK (ID: run-rahul-0921)' }],
      confidence: 0.98,
      alternatives: ['Treat as routine adult runaway (Rejected: subject is 16)', 'Wait for 24h threshold (Prohibited: immediate danger protocol)']
    }
  },
  {
    stepIndex: 1,
    timeOffsetSec: 4,
    run_id: 'run-rahul-0921',
    agent: 'report_analysis',
    event_type: 'task_created',
    title: 'Report Structured & Clues Extracted',
    summary: 'Extracted: Clothing (Blue shirt, black trousers), Transit route (Bus 42B), Phone battery low.',
    payload: { taskId: 'task-intake-01', status: 'completed' },
    particles: [
      { from: 'report_analysis', to: 'orchestrator', label: 'Structured Profile', payloadPreview: 'Urgency: 88/100, Clues: 5, Key Transit: Metro/Bus Line' }
    ],
    thoughtTrace: {
      agent: 'report_analysis',
      reasoning: 'Extracted key anchors: Last confirmed spot is College Bus Stop (17.3850 N, 78.4867 E). Missing wallet, low battery ping at 4:45 PM. Urgency index 88/100. Nightfall in 1 hour.',
      toolsCalled: [{ name: 'text_nlp_extract', params: 'raw_report_text', output: 'Extracted 5 spatial-temporal entities' }],
      confidence: 0.94,
      alternatives: ['Request more family photos (Skipped: textual details sufficient for initial perimeter)'],
      urgencyScore: '88/100 (High Risk: Minor, Nightfall)'
    }
  },
  {
    stepIndex: 2,
    timeOffsetSec: 8,
    run_id: 'run-rahul-0921',
    agent: 'orchestrator',
    event_type: 'task_updated',
    title: 'Task Delegation: Search & Spatial Modeling',
    summary: 'Orchestrator commands Search Planning to generate initial radius grid.',
    payload: { assignedTo: 'search_planning', task: 'Compute Zone Alpha (1.5km)' },
    particles: [
      { from: 'orchestrator', to: 'search_planning', label: 'Anchor Coords', payloadPreview: 'Anchor: College Bus Stop, Time: 4:30 PM, Radius: 1.5km' }
    ],
    thoughtTrace: {
      agent: 'orchestrator',
      reasoning: 'Spawning initial Zone Alpha based on pedestrian walking speed over 45 minutes (approx 3km max dispersion). Directing Search Planning to build priority map tiles.',
      toolsCalled: [{ name: 'blackboard.post_task', params: 'assigned="search_planning", priority="high"', output: 'Task #SP-101 posted' }],
      confidence: 0.96,
      alternatives: ['Mobilize city-wide search (Rejected: too sparse, concentrate around bus route first)']
    }
  },
  {
    stepIndex: 3,
    timeOffsetSec: 12,
    run_id: 'run-rahul-0921',
    agent: 'search_planning',
    event_type: 'tool_result',
    title: 'Zone Alpha & Timeline Constructed',
    summary: 'Zone Alpha established: 1.5km radius around College Stop. 3 search sectors flagged.',
    payload: { zone: 'Alpha', radiusKm: 1.5, sectors: 3 },
    particles: [
      { from: 'search_planning', to: 'rescue_coordination', label: 'Sector Maps', payloadPreview: 'Sector A1 (Bus Stop), A2 (Metro Walkway), A3 (Market Alley)' }
    ],
    thoughtTrace: {
      agent: 'search_planning',
      reasoning: 'Calculated probability cloud: 65% probability subject utilized pedestrian underpass towards Metro Line 1. Setting Sector A2 as priority 1.',
      toolsCalled: [{ name: 'osm_isochrone_calc', params: 'lat=17.3850, lon=78.4867, time=45min', output: 'Polygons: 3 sectors' }],
      confidence: 0.91,
      alternatives: ['Uniform circular radius (Suboptimal: ignores railway barrier on East flank)']
    }
  },
  {
    stepIndex: 4,
    timeOffsetSec: 16,
    run_id: 'run-rahul-0921',
    agent: 'orchestrator',
    event_type: 'message_sent',
    title: 'Incoming Sighting Webhook #1 (Park Metro)',
    summary: 'Public sighting: "Boy in royal blue shirt asking for directions near Park Metro at 5:15 PM"',
    payload: { sightingId: 'sight-01', location: 'Park Metro', time: '5:15 PM' },
    particles: [
      { from: 'orchestrator', to: 'verification', label: 'Route Sighting #1', payloadPreview: 'Sighting: Park Metro, 5:15 PM, Blue Shirt' }
    ],
    thoughtTrace: {
      agent: 'orchestrator',
      reasoning: 'External webhook fired with Sighting #1. Directing directly to Verification Agent for consistency audit and hallucination check.',
      toolsCalled: [{ name: 'webhook.ingest', params: 'source="community_portal"', output: 'Verified valid payload' }],
      confidence: 0.95,
      alternatives: []
    }
  },
  {
    stepIndex: 5,
    timeOffsetSec: 20,
    run_id: 'run-rahul-0921',
    agent: 'verification',
    event_type: 'decision_made',
    title: 'Sighting #1 VERIFIED (Score: 0.92)',
    summary: 'High spatial-temporal coherence (2.1 km transit in 45m). Clothing matches exactly.',
    payload: { status: 'verified', confidence: 0.92 },
    particles: [
      { from: 'verification', to: 'search_planning', label: 'Verified Sighting', payloadPreview: 'Location: Park Metro Station (CONFIRMED 0.92)' },
      { from: 'verification', to: 'orchestrator', label: 'Audit Passed', payloadPreview: 'Sighting #1 Validated' }
    ],
    thoughtTrace: {
      agent: 'verification',
      reasoning: 'Audited Sighting #1: Transit speed calculated at 2.8 km/h (standard pedestrian speed). Clothing "royal blue shirt" matches family intake description. Confidence score: 0.92 (>0.85 threshold). Validating as credible evidence.',
      toolsCalled: [{ name: 'verify_spatiotemporal', params: 't1="4:30", t2="5:15", dist="2.1km"', output: 'Feasible: YES (2.8 km/h)' }],
      confidence: 0.92,
      alternatives: ['Flag as unverified (Rejected: perfectly aligns with Metro walking vector)']
    }
  },
  {
    stepIndex: 6,
    timeOffsetSec: 24,
    run_id: 'run-rahul-0921',
    agent: 'search_planning',
    event_type: 'task_updated',
    title: 'Autonomous Re-planning: Zone Beta Activated',
    summary: 'Search vector shifted 2.1km West. Zone Beta (Metro Station & North Exit) established.',
    payload: { zone: 'Beta', shiftKm: 2.1, newPriority: 'Park Metro Concourse' },
    particles: [
      { from: 'search_planning', to: 'rescue_coordination', label: 'Re-planned Sectors', payloadPreview: 'Deploy Sectors B1 (Ticket Gates), B2 (North Depot)' }
    ],
    thoughtTrace: {
      agent: 'search_planning',
      reasoning: 'Re-planning triggered by verified sighting at Park Metro. Shifted central search centroid to 17.3910 N, 78.4720 E. Sector B1 now designated Critical Priority.',
      toolsCalled: [{ name: 'osm_zone_replan', params: 'anchor="Park Metro", decay=0.85', output: 'Generated Zone Beta' }],
      confidence: 0.95,
      alternatives: ['Retain Zone Alpha as primary (Rejected: verified sighting proves subject transitioned out)']
    }
  },
  {
    stepIndex: 7,
    timeOffsetSec: 28,
    run_id: 'run-rahul-0921',
    agent: 'orchestrator',
    event_type: 'message_sent',
    title: 'Incoming Sighting #2 (Twitter Repost)',
    summary: 'Social scraper ingestion: "Saw someone matching description 15 mins ago".',
    payload: { sightingId: 'sight-02', source: 'Social Webhook' },
    particles: [
      { from: 'orchestrator', to: 'verification', label: 'Audit Sighting #2', payloadPreview: 'Social text: "Saw blue shirt 15m ago near stadium"' }
    ],
    thoughtTrace: {
      agent: 'orchestrator',
      reasoning: 'Sighting #2 received via social feed. Handing off to Verification Agent for duplicate checking.',
      toolsCalled: [{ name: 'queue.pop', params: 'sight-02', output: 'Queued' }],
      confidence: 0.90,
      alternatives: []
    }
  },
  {
    stepIndex: 8,
    timeOffsetSec: 32,
    run_id: 'run-rahul-0921',
    agent: 'verification',
    event_type: 'decision_made',
    title: 'Sighting #2 FLAGGED: Duplicate Text (Score: 0.15)',
    summary: 'Exact wording match with circulating viral tweet. Discarded to protect search focus.',
    payload: { status: 'flagged_duplicate', confidence: 0.15 },
    particles: [
      { from: 'verification', to: 'orchestrator', label: 'Duplicate Alert', payloadPreview: 'Rejected Sighting #2: Duplicate text hash (0.15)' }
    ],
    thoughtTrace: {
      agent: 'verification',
      reasoning: 'CRITIC ALERT: Text hash matches an identical post made 2 hours prior regarding a different incident. Cosine similarity 0.98. Confidence: 0.15 (<0.85 threshold). Rejecting; search plan will NOT be disrupted.',
      toolsCalled: [{ name: 'text_dedup_hash', params: 'hash="a9f24e"', output: 'Match found in archive' }],
      confidence: 0.15,
      alternatives: ['Forward to search team (Disastrous: would divert valuable volunteers on false lead)']
    }
  },
  {
    stepIndex: 9,
    timeOffsetSec: 36,
    run_id: 'run-rahul-0921',
    agent: 'rescue_coordination',
    event_type: 'task_created',
    title: 'Volunteer Missions Partitioned & Staged',
    summary: 'Created 4 targeted tasks for authorized volunteers across Zone Beta without duplicate overlap.',
    payload: { tasksGenerated: 4, volunteersAssigned: 8 },
    particles: [
      { from: 'rescue_coordination', to: 'orchestrator', label: 'Task Manifest', payloadPreview: '4 Tasks: Station CCTV Check, Shopfront Query, Bus Bay Sweep' }
    ],
    thoughtTrace: {
      agent: 'rescue_coordination',
      reasoning: 'Allocated 8 verified volunteer responders across 4 non-overlapping quadrants in Zone Beta. Assigned Task V-101 (Station Master contact) to Team Lead Sarah.',
      toolsCalled: [{ name: 'db.assign_volunteers', params: 'zone="Beta", count=8', output: '4 tasks created' }],
      confidence: 0.93,
      alternatives: ['Allow unorganized volunteer surge (Prohibited: safety and privacy guidelines enforce credentialed teams only)']
    }
  },
  {
    stepIndex: 10,
    timeOffsetSec: 40,
    run_id: 'run-rahul-0921',
    agent: 'family_communication',
    event_type: 'agent_status_changed',
    title: 'Family Liaison Drafts Progress Memo',
    summary: 'Draft prepared: Empathetic, verified facts only. Operational coordinates omitted for privacy.',
    payload: { status: 'working' },
    particles: [
      { from: 'family_communication', to: 'orchestrator', label: 'Draft Memo', payloadPreview: 'Subject: Verified Sighting at Park Metro & Active Field Team' }
    ],
    thoughtTrace: {
      agent: 'family_communication',
      reasoning: 'Drafting update for Rahul\'s guardians: "Search teams are actively coordinating around Park Metro following a credible sighting at 5:15 PM. Police liaison notified. No sensitive personal data exposed." Holding for coordinator approval.',
      toolsCalled: [{ name: 'template.family_memo', params: 'tone="reassuring_factual"', output: 'Draft #FM-402' }],
      confidence: 0.97,
      alternatives: ['Include live GPS traces of volunteers (Strictly Forbidden: safety privacy policy)']
    }
  },
  {
    stepIndex: 11,
    timeOffsetSec: 44,
    run_id: 'run-rahul-0921',
    agent: 'orchestrator',
    event_type: 'approval_requested',
    title: 'HUMAN APPROVAL GATE: HOLD EVENT TRIGGERED',
    summary: 'System paused. Coordinator sign-off required before family update & field dispatch.',
    payload: { status: 'hold', requiresHuman: true },
    particles: [],
    thoughtTrace: {
      agent: 'orchestrator',
      reasoning: 'MANDATORY SAFETY GATE: Autonomous actions involving family notification and volunteer field deployment require human coordinator authorization. Pausing execution clock. Awaiting signature.',
      toolsCalled: [{ name: 'gatekeeper.hold', params: 'timeout=300s', output: 'System State: HOLD' }],
      confidence: 1.0,
      alternatives: ['Auto-send without human check (Prohibited: Core safety covenant violated)']
    },
    approvalHold: {
      requestId: 'gate-rahul-fm01',
      title: 'Human Coordinator Sign-off Required',
      riskLevel: 'high',
      agent: 'family_communication',
      action: 'Dispatch Family Progress Update & Mobilize 8 Field Volunteers',
      preview: {
        recipient: 'Guardian: Smt. Sunita (Mother) via Verified In-App Link',
        message: 'Dear Sunita, our coordination network has verified a credible sighting of Rahul near the Park Metro station concourse at 5:15 PM. 8 authorized volunteers are actively searching the sector in coordination with local authorities.',
        safeguardsEnforced: [
          'No biometric or facial recognition data utilized',
          'Exact live volunteer coordinates redacted',
          'Official emergency services advisory banner included'
        ]
      }
    }
  },
  {
    stepIndex: 12,
    timeOffsetSec: 48,
    run_id: 'run-rahul-0921',
    agent: 'orchestrator',
    event_type: 'decision_made',
    title: 'Coordinator Sign-off Approved: Dispatching Packets',
    summary: 'Human coordinator clicked Approve. Outbound family SMS/Notification & Task dispatch live.',
    payload: { status: 'approved', signedBy: 'Lead Coordinator Alex V.' },
    particles: [
      { from: 'orchestrator', to: 'family_communication', label: 'Approval Signal', payloadPreview: 'AUTHORIZED: Dispatch Family Memo' },
      { from: 'orchestrator', to: 'rescue_coordination', label: 'Mobilize Teams', payloadPreview: 'AUTHORIZED: Release Volunteer Tasks' }
    ],
    thoughtTrace: {
      agent: 'orchestrator',
      reasoning: 'Human authorization confirmed. Resuming autonomous queue. Releasing volunteer assignments to mobile field app and sending encrypted family progress memo.',
      toolsCalled: [{ name: 'gatekeeper.release', params: 'auth_token="COORD-AlexV"', output: 'Released' }],
      confidence: 1.0,
      alternatives: []
    }
  },
  {
    stepIndex: 13,
    timeOffsetSec: 52,
    run_id: 'run-rahul-0921',
    agent: 'orchestrator',
    event_type: 'run_completed',
    title: 'Mission Cycle Complete: Active Monitoring Engaged',
    summary: 'Case active. Search zones mapped, 1 verified sighting, 1 duplicate discarded, 8 responders deployed.',
    payload: {
      status: 'completed',
      metrics: {
        totalDurationSec: 52,
        sightingsProcessed: 2,
        verifiedSightings: 1,
        rejectedSightings: 1,
        activeSearchZones: 2,
        volunteersMobilized: 8,
        costSavedVsManualHours: '4.5 hrs saved'
      }
    },
    particles: [
      { from: 'orchestrator', to: 'search_planning', label: 'Monitor Loop', payloadPreview: 'Standing by for next sighting/schedule ping' }
    ],
    thoughtTrace: {
      agent: 'orchestrator',
      reasoning: 'Cycle 1 completed flawlessly. Background scheduler set to re-ping cell tower logs and CCTV leads every 15 minutes. All safety constraints respected.',
      toolsCalled: [{ name: 'scheduler.register_cron', params: 'interval="15m"', output: 'Cron Job #CJ-908 active' }],
      confidence: 0.99,
      alternatives: ['Close case (Strictly Prohibited: only humans can close or declare found)']
    }
  }
];
