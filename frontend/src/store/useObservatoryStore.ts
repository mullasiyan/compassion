import { create } from 'zustand';
import { AgentRole, AgentState, MessageParticle, RoleView, ScriptedEvent } from '../types';
import { SCRIPTED_RAHUL_DEMO, AGENT_REGISTRY } from '../mock/scriptedDemo';
import { sound } from '../utils/audio';

interface ObservatoryStore {
  screen: 'launch' | 'observatory';
  roleView: RoleView;
  streamMode: 'mock' | 'live';
  isLiveConnected: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  currentStepIndex: number;
  selectedAgent: AgentRole | null;
  isApprovalModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isSoundEnabled: boolean;
  demoMode: boolean;
  isFailureSimulated: boolean;
  agentStates: Record<AgentRole, AgentState>;
  activeParticles: MessageParticle[];

  // Actions
  setScreen: (screen: 'launch' | 'observatory') => void;
  setRoleView: (view: RoleView) => void;
  toggleStreamMode: () => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  jumpToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSelectedAgent: (agent: AgentRole | null) => void;
  toggleSound: () => void;
  toggleDemoMode: () => void;
  toggleCommandPalette: () => void;
  triggerSimulateFailure: () => void;
  approveGate: (editedText?: string) => Promise<void>;
  rejectGate: () => Promise<void>;
  triggerSightingWebhook: (type?: string) => Promise<void>;
  triggerLiveBackendCase: () => Promise<void>;
  triggerPatrolCheck: () => Promise<void>;
  ingestLiveEvent: (event: ScriptedEvent) => void;
  resetRun: () => void;
}

const initialAgentStates: Record<AgentRole, AgentState> = {
  orchestrator: { status: 'idle', currentTask: 'Awaiting Case Intake', confidence: 1.0 },
  report_analysis: { status: 'idle', currentTask: 'Standby for raw report', confidence: 1.0 },
  verification: { status: 'idle', currentTask: 'Standby for sighting telemetry', confidence: 1.0 },
  search_planning: { status: 'idle', currentTask: 'Standby for anchors', confidence: 1.0 },
  rescue_coordination: { status: 'idle', currentTask: 'Standby for sector map', confidence: 1.0 },
  family_communication: { status: 'idle', currentTask: 'Standby for coordinator approval', confidence: 1.0 },
};

let liveEventSource: EventSource | null = null;

export const useObservatoryStore = create<ObservatoryStore>((set, get) => ({
  screen: 'launch',
  roleView: 'observatory',
  streamMode: 'mock',
  isLiveConnected: false,
  isPlaying: false,
  playbackSpeed: 1,
  currentStepIndex: 0,
  selectedAgent: 'orchestrator',
  isApprovalModalOpen: false,
  isCommandPaletteOpen: false,
  isSoundEnabled: false,
  demoMode: true,
  isFailureSimulated: false,
  agentStates: initialAgentStates,
  activeParticles: [],

  setScreen: (screen) => set({ screen }),
  setRoleView: (roleView) => set({ roleView }),

  toggleStreamMode: () => {
    const nextMode = get().streamMode === 'mock' ? 'live' : 'mock';
    set({ streamMode: nextMode });

    if (nextMode === 'live') {
      try {
        if (liveEventSource) liveEventSource.close();
        liveEventSource = new EventSource('/api/events/stream');

        liveEventSource.addEventListener('connected', () => {
          set({ isLiveConnected: true });
          sound.playAgentPulse();
        });

        liveEventSource.addEventListener('agent_event', (e: MessageEvent) => {
          try {
            const parsedEvent = JSON.parse(e.data);
            get().ingestLiveEvent(parsedEvent);
          } catch (err) {
            console.error('Error parsing live SSE event:', err);
          }
        });

        liveEventSource.onerror = () => {
          set({ isLiveConnected: false });
        };
      } catch (err) {
        console.warn('Failed to connect to backend SSE:', err);
        set({ isLiveConnected: false });
      }
    } else {
      if (liveEventSource) {
        liveEventSource.close();
        liveEventSource = null;
      }
      set({ isLiveConnected: false });
    }
  },

  ingestLiveEvent: (event: ScriptedEvent) => {
    const updatedStates = { ...get().agentStates };

    if (event.agent !== 'system') {
      updatedStates[event.agent] = {
        ...updatedStates[event.agent],
        status: event.payload?.status === 'completed' ? 'done' : 'working',
        currentTask: event.title,
        confidence: event.thoughtTrace?.confidence ?? 0.95,
        reasoningSnippet: event.thoughtTrace?.reasoning
      };
    }

    const newParticles: MessageParticle[] = (event.particles || []).map((p, idx) => ({
      id: `live-p-${Date.now()}-${idx}`,
      from: p.from,
      to: p.to,
      label: p.label,
      payloadPreview: p.payloadPreview,
      progress: 0,
      color: AGENT_REGISTRY[p.from].color,
      createdAt: Date.now()
    }));

    if (newParticles.length > 0) {
      sound.playHandoff();
    } else {
      sound.playAgentPulse();
    }

    const isHold = !!event.approvalHold;
    if (isHold) {
      sound.playHoldAlert();
    }

    set({
      agentStates: updatedStates,
      activeParticles: newParticles,
      isApprovalModalOpen: isHold,
      selectedAgent: event.agent !== 'system' ? event.agent : get().selectedAgent
    });
  },

  triggerLiveBackendCase: async () => {
    try {
      const resp = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Rahul',
          age: 16,
          last_seen_time: '4:30 PM',
          last_seen_location: 'College Bus Stop',
          clothing: 'Royal blue shirt, black trousers',
          details: { transit_route: 'Bus 42B', battery: 'Low' }
        })
      });
      if (resp.ok) {
        sound.playAgentPulse();
        set({ screen: 'observatory' });
      }
    } catch (err) {
      console.error('Error submitting live case to backend:', err);
    }
  },

  triggerPatrolCheck: async () => {
    if (get().streamMode === 'live' && get().isLiveConnected) {
      try {
        await fetch('/api/triggers/patrol', { method: 'POST' });
        sound.playAgentPulse();
      } catch (e) {
        console.error(e);
      }
    } else {
      sound.playAgentPulse();
      get().jumpToStep(13);
    }
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  
  togglePlay: () => {
    const nextPlaying = !get().isPlaying;
    set({ isPlaying: nextPlaying });
    if (nextPlaying && get().currentStepIndex >= SCRIPTED_RAHUL_DEMO.length - 1) {
      get().jumpToStep(0);
    }
  },

  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

  jumpToStep: (index: number) => {
    const clamped = Math.max(0, Math.min(index, SCRIPTED_RAHUL_DEMO.length - 1));
    const event = SCRIPTED_RAHUL_DEMO[clamped];

    const updatedStates = { ...get().agentStates };
    
    if (event.agent !== 'system') {
      updatedStates[event.agent] = {
        ...updatedStates[event.agent],
        status: event.payload.status === 'completed' ? 'done' : 'working',
        currentTask: event.title,
        confidence: event.thoughtTrace?.confidence ?? 0.95,
        reasoningSnippet: event.thoughtTrace?.reasoning
      };
    }

    const newParticles: MessageParticle[] = (event.particles || []).map((p, idx) => ({
      id: `p-${clamped}-${idx}-${Date.now()}`,
      from: p.from,
      to: p.to,
      label: p.label,
      payloadPreview: p.payloadPreview,
      progress: 0,
      color: AGENT_REGISTRY[p.from].color,
      createdAt: Date.now()
    }));

    if (newParticles.length > 0) {
      sound.playHandoff();
    } else {
      sound.playAgentPulse();
    }

    const isHold = !!event.approvalHold;
    if (isHold) {
      sound.playHoldAlert();
    }

    set({
      currentStepIndex: clamped,
      agentStates: updatedStates,
      activeParticles: newParticles,
      isApprovalModalOpen: isHold,
      isPlaying: isHold ? false : get().isPlaying
    });
  },

  nextStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex < SCRIPTED_RAHUL_DEMO.length - 1) {
      get().jumpToStep(currentStepIndex + 1);
    } else {
      sound.playSuccess();
      set({ isPlaying: false });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      get().jumpToStep(currentStepIndex - 1);
    }
  },

  setSelectedAgent: (selectedAgent) => set({ selectedAgent }),

  toggleSound: () => {
    const nextSound = !get().isSoundEnabled;
    sound.setEnabled(nextSound);
    set({ isSoundEnabled: nextSound });
    if (nextSound) sound.playAgentPulse();
  },

  toggleDemoMode: () => set((s) => ({ demoMode: !s.demoMode })),
  toggleCommandPalette: () => set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),

  triggerSimulateFailure: () => {
    sound.playHoldAlert();
    set((s) => {
      const updatedStates = { ...s.agentStates };
      updatedStates.verification = {
        ...updatedStates.verification,
        status: 'failed',
        currentTask: 'SIMULATED CRITIC TIMEOUT (Auto-recovery backoff engaging)',
        confidence: 0.12,
        reasoningSnippet: 'Simulated exception: Network packet corruption on Sighting Feed. Falling back to cached snapshot and restarting critic loop.'
      };
      return {
        isFailureSimulated: true,
        selectedAgent: 'verification',
        agentStates: updatedStates
      };
    });

    setTimeout(() => {
      set((s) => {
        const recoveredStates = { ...s.agentStates };
        recoveredStates.verification = {
          ...recoveredStates.verification,
          status: 'working',
          currentTask: 'Self-healed: Fallback cache ingested successfully',
          confidence: 0.94,
          reasoningSnippet: 'Circuit-breaker restored. Switched to offline verified snapshot. Sighting audit resumed.'
        };
        sound.playAgentPulse();
        return { isFailureSimulated: false, agentStates: recoveredStates };
      });
    }, 4000);
  },

  approveGate: async (editedText?: string) => {
    sound.playSuccess();
    set({ isApprovalModalOpen: false });

    if (get().streamMode === 'live' && get().isLiveConnected) {
      try {
        await fetch('/api/cases/run-rahul-0921/approvals/gate-rahul-fm01', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: editedText ? 'edit' : 'approve',
            coordinator_name: 'Lead Coordinator Alex V.',
            edited_message: editedText
          })
        });
      } catch (err) {
        console.error('Failed to submit live approval:', err);
      }
    } else {
      // Mock step jump to 12
      get().jumpToStep(12);
    }
  },

  rejectGate: async () => {
    sound.playHoldAlert();
    set({ isApprovalModalOpen: false });

    if (get().streamMode === 'live' && get().isLiveConnected) {
      try {
        await fetch('/api/cases/run-rahul-0921/approvals/gate-rahul-fm01', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'reject',
            coordinator_name: 'Lead Coordinator Alex V.'
          })
        });
      } catch (err) {
        console.error('Failed to submit live reject:', err);
      }
    }
  },

  triggerSightingWebhook: async (type = 'verified') => {
    sound.playHandoff();
    if (get().streamMode === 'live' && get().isLiveConnected) {
      try {
        await fetch('/api/cases/run-rahul-0921/sightings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'Park Metro',
            time: '5:15 PM',
            description: 'Boy in royal blue shirt asking for directions near Station Concourse',
            source: 'community_webhook'
          })
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      get().jumpToStep(4);
    }
  },

  resetRun: () => {
    set({
      currentStepIndex: 0,
      isPlaying: false,
      isApprovalModalOpen: false,
      agentStates: initialAgentStates,
      activeParticles: [],
      selectedAgent: 'orchestrator'
    });
  }
}));
