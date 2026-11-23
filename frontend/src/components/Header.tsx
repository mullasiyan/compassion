import React, { useState } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';
import { AnalyticsModal } from './AnalyticsModal';
import { RoleView } from '../types';

export const Header: React.FC = () => {
  const {
    roleView,
    setRoleView,
    isSoundEnabled,
    toggleSound,
    toggleCommandPalette,
    triggerSimulateFailure,
    isFailureSimulated,
    streamMode,
    toggleStreamMode,
    isLiveConnected,
    demoMode,
    toggleDemoMode,
    triggerLiveBackendCase,
    screen,
    setScreen
  } = useObservatoryStore();

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  return (
    <>
      <header className="relative z-30 flex flex-col border-b border-white/10 bg-[#060A17]/90 backdrop-blur-md">
        {/* Official Safety Mandate Banner */}
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-amber-950/80 px-4 py-1 text-center border-b border-amber-500/20">
          <p className="text-[11px] font-mono tracking-wide text-amber-300/90 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>SAFETY COVENANT: Contact police or emergency services immediately. LostLink supports, and does not replace, official channels. AI cannot close cases.</span>
          </p>
        </div>

        {/* Main Header Bar */}
        <div className="flex items-center justify-between px-5 py-2.5">
          {/* Brand & System Pulse */}
          <div className="flex items-center gap-5">
            <div 
              onClick={() => setScreen('launch')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)] group-hover:border-cyan-300 transition-all">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold tracking-tight text-base text-white">LostLink</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">OBSERVATORY</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">Autonomous Search & Rescue</p>
              </div>
            </div>

            {/* System Health Indicators */}
            <div className="hidden lg:flex items-center gap-3.5 pl-4 border-l border-white/10 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isFailureSimulated ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className={isFailureSimulated ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {isFailureSimulated ? 'Critic: Degraded (Self-Healing)' : 'Swarm: Healthy'}
                </span>
              </div>

              <span className="text-slate-600">|</span>

              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>DB: Online</span>
              </div>

              <span className="text-slate-600">|</span>

              {/* Demo Mode Toggle */}
              <button
                onClick={toggleDemoMode}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                  demoMode
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
                title="Toggle Demo Mode with zero-latency cached snapshots"
              >
                {demoMode ? 'DEMO: CACHED' : 'LIVE API'}
              </button>

              <span className="text-slate-600">|</span>

              {/* Live / Mock Stream Mode Toggle (Mock is Default) */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleStreamMode}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                    streamMode === 'live'
                      ? isLiveConnected
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                        : 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle between Safe Client Mock Stream and Live FastAPI Backend SSE"
                >
                  {streamMode === 'live' ? (isLiveConnected ? '● LIVE SSE' : '○ CONNECTING...') : 'MOCK STREAM'}
                </button>

                {streamMode === 'live' && isLiveConnected && (
                  <button
                    onClick={triggerLiveBackendCase}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 transition-all font-bold"
                    title="Send POST /api/cases to backend"
                  >
                    ▶ Send POST
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Role View Tabs */}
          {screen === 'observatory' && (
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setRoleView('observatory')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  roleView === 'observatory'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Observatory
              </button>
              <button
                onClick={() => setRoleView('rescue_team')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  roleView === 'rescue_team'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,157,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rescue Team
              </button>
              <button
                onClick={() => setRoleView('family_portal')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  roleView === 'family_portal'
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_10px_rgba(255,0,122,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Family Portal
              </button>
            </div>
          )}

          {/* Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Analytics & PDF Download Modal Button */}
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all font-semibold flex items-center gap-1.5"
              title="View Mission Analytics and Download PDF Dossier"
            >
              <span>📊 Analytics & PDF</span>
            </button>

            {/* Working Simulate Failure Button */}
            <button
              onClick={triggerSimulateFailure}
              disabled={isFailureSimulated}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                isFailureSimulated
                  ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                  : 'bg-white/5 border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/60'
              }`}
              title="Demonstrate dynamic self-healing when an agent fails"
            >
              {isFailureSimulated ? 'Heal Engaging...' : '⚡ Sim Failure'}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border text-xs font-mono transition-all ${
                isSoundEnabled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title={isSoundEnabled ? 'Mute Audio Synth' : 'Enable Cyber Tones Synth'}
            >
              {isSoundEnabled ? '🔊 ON' : '🔇 OFF'}
            </button>

            {/* Command Palette Trigger */}
            <button
              onClick={toggleCommandPalette}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] text-slate-400">Ctrl K</kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Analytics & PDF Download Modal */}
      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />
    </>
  );
};
