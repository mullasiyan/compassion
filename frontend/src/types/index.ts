export type AgentRole = 
  | 'orchestrator'
  | 'report_analysis'
  | 'verification'
  | 'search_planning'
  | 'rescue_coordination'
  | 'family_communication';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'failed' | 'done';

export interface AgentMetadata {
  id: AgentRole;
  name: string;
  roleTitle: string;
  color: string;
  glowColor: string;
  xPercent: number; // 0-100 canvas position
  yPercent: number;
  description: string;
}

export interface AgentState {
  status: AgentStatus;
  currentTask?: string;
  activeTools?: string[];
  lastMessage?: string;
  confidence?: number;
  reasoningSnippet?: string;
  tasksCount?: number;
}

export type EventType =
  | 'agent_status_changed'
  | 'task_created'
  | 'task_updated'
  | 'message_sent'
  | 'tool_called'
  | 'tool_result'
  | 'decision_made'
  | 'approval_requested'
  | 'run_completed'
  | 'error_occurred';

export interface ScriptedEvent {
  stepIndex: number;
  timeOffsetSec: number;
  run_id: string;
  agent: AgentRole | 'system';
  event_type: EventType;
  title: string;
  summary: string;
  payload: any;
  particles?: {
    from: AgentRole;
    to: AgentRole;
    label: string;
    payloadPreview: string;
  }[];
  thoughtTrace?: {
    agent: AgentRole;
    reasoning: string;
    toolsCalled: { name: string; params: string; output: string }[];
    confidence: number;
    alternatives: string[];
    urgencyScore?: string;
  };
  approvalHold?: {
    requestId: string;
    title: string;
    riskLevel: 'medium' | 'high' | 'critical';
    agent: AgentRole;
    action: string;
    preview: {
      recipient: string;
      message: string;
      safeguardsEnforced: string[];
    };
  };
}

export interface MessageParticle {
  id: string;
  from: AgentRole;
  to: AgentRole;
  label: string;
  payloadPreview: string;
  progress: number; // 0.0 to 1.0
  color: string;
  createdAt: number;
}

export type RoleView = 'observatory' | 'rescue_team' | 'family_portal';
