import React from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';

export const HowItWorksView: React.FC = () => {
  const { setScreen } = useObservatoryStore();

  return (
    <div className="relative z-10 flex flex-col h-full w-full max-w-6xl mx-auto p-6 overflow-y-auto">
      {/* Permanent Safety Banner */}
      <div className="w-full mb-6 py-2 px-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span>🛡️</span>
          <span>SAFETY COVENANT: Contact police or emergency services immediately. LostLink supports, and does not replace, official channels. AI cannot close cases.</span>
        </div>
        <button
          onClick={() => setScreen('observatory')}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-all"
        >
          Skip to Observatory →
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <span className="mission-badge">CELESTIAL ARCHITECTURE</span>
        <h1 className="text-3xl font-display font-bold text-white tracking-wider">
          How LostLink Solar System Works
        </h1>
        <p className="text-slate-400 font-mono text-sm max-w-xl">
          An autonomous multi-agent search-and-rescue constellation modeled as a living planetary system. Guided interactive story coming in Step E.
        </p>
      </div>
    </div>
  );
};
