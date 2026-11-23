import React, { useState } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';
import { SCRIPTED_RAHUL_DEMO } from '../mock/scriptedDemo';

export const ApprovalModal: React.FC = () => {
  const { isApprovalModalOpen, currentStepIndex, approveGate, rejectGate } = useObservatoryStore();

  const [isEditing, setIsEditing] = useState(false);
  const currentEvent = SCRIPTED_RAHUL_DEMO[currentStepIndex];
  const holdData = currentEvent?.approvalHold;

  const [editedMessage, setEditedMessage] = useState(
    holdData?.preview.message || ''
  );

  if (!isApprovalModalOpen || !holdData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl glass-hold-glow rounded-3xl p-6 text-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Glowing Amber Badge & Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono tracking-wider uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              HUMAN-IN-THE-LOOP · HOLD GATE
            </div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">
              {holdData.title}
            </h2>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 font-mono text-[11px] font-bold uppercase">
            {holdData.riskLevel} Risk Action
          </span>
        </div>

        {/* Action Description */}
        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 text-xs font-mono space-y-1">
          <div className="text-amber-300/80 uppercase tracking-wider text-[10px]">Staged Autonomous Action:</div>
          <div className="text-white font-semibold">{holdData.action}</div>
        </div>

        {/* Draft Message Preview / Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Target Recipient: <span className="text-cyan-300 font-semibold">{holdData.preview.recipient}</span></span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-amber-400 hover:text-amber-300 underline text-[11px]"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Text'}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl bg-black/60 border border-amber-500/40 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
            />
          ) : (
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-slate-200 leading-relaxed italic">
              "{editedMessage}"
            </div>
          )}
        </div>

        {/* Built-in Safety Constraints */}
        <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono">
          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Active Safety Safeguards:</div>
          <div className="space-y-1">
            {holdData.preview.safeguardsEnforced.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-emerald-400">
                <span>✓</span>
                <span className="text-slate-300">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Decision Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            onClick={rejectGate}
            className="px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/50 text-xs font-mono font-semibold transition-all"
          >
            Reject & Revise
          </button>

          <button
            onClick={approveGate}
            className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 text-xs font-mono font-bold shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all flex items-center gap-2"
          >
            <span>Approve & Mobilize</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
