import React, { useState, useEffect } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';
import { AGENT_REGISTRY, SCRIPTED_RAHUL_DEMO } from '../mock/scriptedDemo';

export const ThoughtTraceDrawer: React.FC = () => {
  const { selectedAgent, setSelectedAgent, currentStepIndex, agentStates } = useObservatoryStore();

  const [displayedReasoning, setDisplayedReasoning] = useState('');

  if (!selectedAgent) return null;

  const agentMeta = AGENT_REGISTRY[selectedAgent];
  const currentState = agentStates[selectedAgent];
  const currentEvent = SCRIPTED_RAHUL_DEMO[currentStepIndex];

  // Pick thought trace for current agent from active step or fallback to recent memory
  const trace = currentEvent.thoughtTrace?.agent === selectedAgent
    ? currentEvent.thoughtTrace
    : {
        agent: selectedAgent,
        reasoning: currentState.reasoningSnippet || `${agentMeta.name} is currently monitoring the shared SQLite blackboard. Operating in high-speed event streaming mode. Standing by for next task allocation.`,
        toolsCalled: [
          { name: 'db.query_blackboard', params: `agent="${selectedAgent}"`, output: 'Status: OK' }
        ],
        confidence: currentState.confidence || 0.95,
        alternatives: ['Retain current surveillance radius', 'Wait for subsequent telemetry checkpoint']
      };

  // Typewriter effect
  useEffect(() => {
    setDisplayedReasoning('');
    let idx = 0;
    const fullText = trace.reasoning;
    const timer = setInterval(() => {
      idx += 3;
      setDisplayedReasoning(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(timer);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [trace.reasoning]);

  return (
    <aside className="absolute right-4 top-20 bottom-24 w-96 z-20 flex flex-col rounded-2xl glass-panel-glow border border-white/15 overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full shadow-[0_0_12px_currentColor]"
            style={{ backgroundColor: agentMeta.color, color: agentMeta.color }}
          />
          <div>
            <h3 className="font-display font-bold text-sm text-white tracking-tight">{agentMeta.name}</h3>
            <p className="text-[10px] font-mono text-slate-400">{agentMeta.roleTitle}</p>
          </div>
        </div>

        <button
          onClick={() => setSelectedAgent(null)}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white text-xs font-mono transition-all"
        >
          ✕
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {/* Status & Confidence Meter */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Agent Status:</span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${agentMeta.color}25`, color: agentMeta.color }}
            >
              {currentState.status}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">Decision Confidence:</span>
              <span className="text-white font-bold">{Math.round((trace.confidence || 0.95) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(trace.confidence || 0.95) * 100}%`,
                  backgroundColor: trace.confidence > 0.8 ? '#00FF9D' : trace.confidence > 0.5 ? '#FFB800' : '#EF4444'
                }}
              />
            </div>
          </div>
        </div>

        {/* Thought Trace: Typewriter Reasoning */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Autonomous Reasoning Trace
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 text-slate-200 leading-relaxed min-h-[90px]">
            {displayedReasoning}
            <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 animate-pulse" />
          </div>
        </div>

        {/* Tools Called & Outputs */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Tools & Subroutines Invoked
          </div>
          <div className="space-y-2">
            {(trace.toolsCalled || []).map((tool, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-cyan-300 font-semibold">
                  <span>{tool.name}()</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Executed</span>
                </div>
                <div className="text-[10px] text-slate-400">In: <code className="text-slate-300">{tool.params}</code></div>
                <div className="text-[10px] text-slate-400">Out: <code className="text-slate-300">{tool.output}</code></div>
              </div>
            ))}
          </div>
        </div>

        {/* Alternatives Considered (Crucial for Multi-Agent Autonomy) */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Alternatives Evaluated & Pruned
          </div>
          <ul className="space-y-1.5">
            {(trace.alternatives || []).map((alt, idx) => (
              <li key={idx} className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-[11px] text-slate-300 flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span>{alt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};
