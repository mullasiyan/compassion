import React, { useState } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';

export const LaunchScreen: React.FC = () => {
  const { setScreen, togglePlay, demoMode, toggleDemoMode } = useObservatoryStore();
  const [selectedTrigger, setSelectedTrigger] = useState<'manual' | 'schedule' | 'webhook'>('manual');

  const handleLaunch = () => {
    setScreen('observatory');
    togglePlay();
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 overflow-hidden select-none">
      {/* Background Starfield & Subtle Nebulae */}
      <div className="absolute inset-0 bg-radial-gradient from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-3xl w-full flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
        {/* Pitch & Badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-xs font-mono tracking-wider uppercase font-semibold shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            LOSTLINK · MULTI-AGENT SEARCH & RESCUE NETWORK
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 tracking-tight leading-tight">
            Autonomous Swarm Intelligence for Missing-Person Operations
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base font-sans text-slate-300/90 leading-relaxed">
            When minutes matter, specialized AI agents synthesize reports, audit sightings with adversarial critic verification, build dynamic search perimeters, and protect families behind strict human approval gates.
          </p>
        </div>

        {/* Active Incident Intake Card: Rahul (16) */}
        <div className="w-full glass-panel-glow p-6 rounded-3xl text-left border border-cyan-500/30 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-400 animate-pulse shadow-[0_0_10px_#EF4444]" />
              <div>
                <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">ACTIVE EMERGENCY INTAKE</span>
                <h3 className="text-lg font-display font-bold text-white">Case #LL-2026-0921: Rahul (Age 16)</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-mono font-bold">
              PRIORITY: CRITICAL (MINOR)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-slate-400">Last Seen:</span>
              <div className="text-white font-semibold">Today 4:30 PM (3.5h ago)</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-slate-400">Anchor Location:</span>
              <div className="text-cyan-300 font-semibold">College Bus Stop (Sector 4)</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-slate-400">Description:</span>
              <div className="text-white font-semibold">Royal blue shirt, black trousers</div>
            </div>
          </div>

          {/* Trigger Chooser & Demo Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Execution Trigger:</span>
              {(['manual', 'webhook', 'schedule'] as const).map((trig) => (
                <button
                  key={trig}
                  onClick={() => setSelectedTrigger(trig)}
                  className={`px-2.5 py-1 rounded-lg border transition-all uppercase text-[11px] ${
                    selectedTrigger === trig
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {trig}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Demo Mode:</span>
              <button
                onClick={toggleDemoMode}
                className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] font-bold ${
                  demoMode
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {demoMode ? 'ENABLED (SAFE)' : 'LIVE ONLY'}
              </button>
            </div>
          </div>
        </div>

        {/* Launch Mission Button */}
        <button
          onClick={handleLaunch}
          className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-black font-display font-bold text-base tracking-wide shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_55px_rgba(0,240,255,0.65)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <span>LAUNCH AGENT OBSERVATORY</span>
          <span className="group-hover:translate-x-1.5 transition-transform font-mono text-lg">➔</span>
        </button>

        {/* Safety & Compliance Micro-copy */}
        <p className="text-[11px] font-mono text-slate-400 max-w-lg">
          Protected by strict ethical AI policies: Zero facial recognition, zero public tracking, and mandatory human sign-off on volunteer dispatch and family communications.
        </p>
      </div>
    </div>
  );
};
