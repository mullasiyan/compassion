import React, { useEffect } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';
import { SCRIPTED_RAHUL_DEMO, AGENT_REGISTRY } from '../mock/scriptedDemo';

export const TimelineRibbon: React.FC = () => {
  const {
    currentStepIndex,
    jumpToStep,
    nextStep,
    prevStep,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    resetRun
  } = useObservatoryStore();

  const totalSteps = SCRIPTED_RAHUL_DEMO.length;
  const currentEvent = SCRIPTED_RAHUL_DEMO[currentStepIndex];

  // Auto-play interval timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        nextStep();
      }, 3500 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStepIndex, playbackSpeed, nextStep]);

  return (
    <footer className="absolute bottom-3 left-4 right-4 z-20 flex flex-col gap-2 p-3 rounded-2xl glass-panel border border-white/10 shadow-2xl">
      {/* Top Meta Line: Current Action & Playback Controls */}
      <div className="flex items-center justify-between gap-4 text-xs font-mono">
        {/* Left: Active Event Summary */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400 font-bold">
            <span>STEP {currentStepIndex + 1}/{totalSteps}</span>
          </div>

          <div className="truncate">
            <span className="font-semibold text-white mr-2">{currentEvent.title}</span>
            <span className="text-slate-400 hidden md:inline truncate">{currentEvent.summary}</span>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={resetRun}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs"
            title="Replay from start"
          >
            ⏮ Reset
          </button>

          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 transition-all text-xs"
            title="Step backward"
          >
            ◀ Prev
          </button>

          <button
            onClick={togglePlay}
            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(255,184,0,0.3)]'
                : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <button
            onClick={nextStep}
            disabled={currentStepIndex === totalSteps - 1}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 transition-all text-xs"
            title="Step forward"
          >
            Next ▶
          </button>

          <button
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white text-[11px] transition-all"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* Scrubbable Keyframe Ribbon Bar */}
      <div className="relative flex items-center py-1">
        {/* Track */}
        <div className="relative w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStepIndex / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Scrub Slider Input */}
        <input
          type="range"
          min="0"
          max={totalSteps - 1}
          value={currentStepIndex}
          onChange={(e) => jumpToStep(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        />

        {/* Keyframe Markers */}
        <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-1">
          {SCRIPTED_RAHUL_DEMO.map((evt, idx) => {
            const agentMeta = evt.agent !== 'system' ? AGENT_REGISTRY[evt.agent] : null;
            const isPassed = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={idx}
                className="relative flex flex-col items-center group pointer-events-auto cursor-pointer"
                onClick={() => jumpToStep(idx)}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full border transition-all ${
                    isCurrent
                      ? 'scale-150 ring-2 ring-white shadow-[0_0_8px_#FFFFFF]'
                      : isPassed
                      ? 'scale-100'
                      : 'scale-75 opacity-40'
                  }`}
                  style={{
                    backgroundColor: agentMeta?.color || '#00F0FF',
                    borderColor: '#04060C'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
