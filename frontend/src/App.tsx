import React from 'react';
import { useObservatoryStore } from './store/useObservatoryStore';
import { Header } from './components/Header';
import { LaunchScreen } from './components/LaunchScreen';
import { ConstellationCanvas } from './components/ConstellationCanvas';
import { ThoughtTraceDrawer } from './components/ThoughtTraceDrawer';
import { TimelineRibbon } from './components/TimelineRibbon';
import { ApprovalModal } from './components/ApprovalModal';
import { CommandPalette } from './components/CommandPalette';
import { RescueTeamView } from './components/RescueTeamView';
import { FamilyPortalView } from './components/FamilyPortalView';
import { HowItWorksView } from './components/HowItWorksView';
import { StarfieldBackground } from './components/StarfieldBackground';

export default function App() {
  const {
    screen,
    roleView,
    triggerSightingWebhook,
    currentStepIndex
  } = useObservatoryStore();

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#02040A] text-slate-100 select-none">
      {/* 3-Layer Parallax Starfield & Cosmic Nebula Background */}
      <StarfieldBackground />

      {/* Top Universal Mission Control Header (Contains Permanent Safety Banner) */}
      <Header />

      {/* Main View Router */}
      <main className="relative flex-1 w-full h-[calc(100vh-80px)] overflow-hidden z-10">
        {screen === 'launch' ? (
          <LaunchScreen />
        ) : screen === 'how-it-works' ? (
          <HowItWorksView />
        ) : roleView === 'rescue_team' ? (
          <RescueTeamView />
        ) : roleView === 'family_portal' ? (
          <FamilyPortalView />
        ) : (
          /* The Solar Observatory */
          <div className="relative w-full h-full">
            {/* 60 FPS Solar System Canvas */}
            <ConstellationCanvas />

            {/* Floating Left: Case Telemetry & Sighting Injector */}
            <div className="absolute top-4 left-4 z-20 w-80 glass-panel p-4 rounded-2xl border border-white/10 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00F0FF]" />
                  <span className="text-xs font-display font-bold text-white tracking-wide">ACTIVE CASE TELEMETRY</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30">
                  MINOR (16)
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subject:</span>
                  <span className="text-white font-semibold">Rahul (Age 16)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clothing:</span>
                  <span className="text-slate-200">Royal Blue Shirt, Black Pants</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Centroid:</span>
                  <span className="text-cyan-300">
                    {currentStepIndex >= 6 ? 'Park Metro (Shifted)' : 'College Bus Stop'}
                  </span>
                </div>
              </div>

              {/* Sighting Webhook Simulator Button */}
              <button
                onClick={() => triggerSightingWebhook()}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                title="Simulate incoming public sighting webhook"
              >
                <span>📡 Fire Sighting Webhook #1</span>
              </button>
            </div>

            {/* Floating Right: Thought Trace Drawer */}
            <ThoughtTraceDrawer />

            {/* Floating Bottom: Scrubbable Timeline Ribbon */}
            <TimelineRibbon />
          </div>
        )}
      </main>

      {/* Human Approval Gate Modal */}
      <ApprovalModal />

      {/* Command Palette (Ctrl/Cmd+K) */}
      <CommandPalette />
    </div>
  );
}
