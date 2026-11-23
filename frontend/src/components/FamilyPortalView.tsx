import React from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';

export const FamilyPortalView: React.FC = () => {
  const { currentStepIndex } = useObservatoryStore();

  const isApproved = currentStepIndex >= 12;

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-3xl mx-auto font-mono text-slate-100 select-none animate-in fade-in duration-300">
      <div className="border-b border-white/10 pb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase mb-1">
          <span className="w-2 h-2 rounded-full bg-pink-400" />
          Family Support & Status Portal
        </div>
        <h2 className="text-2xl font-display font-bold text-white">Guardian Communications Hub</h2>
        <p className="text-xs text-slate-400 mt-1">
          Encrypted, fact-checked updates prepared by the Family Liaison Agent and approved by human coordinators.
        </p>
      </div>

      {/* Reassurance Message */}
      <div className="glass-panel p-6 rounded-2xl border border-pink-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-pink-300 font-bold uppercase tracking-wider">Latest Official Dispatch</span>
          <span className="text-[10px] text-slate-400">Updated: Today 5:25 PM</span>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 leading-relaxed space-y-2">
          {isApproved ? (
            <p className="font-sans text-sm text-slate-100">
              "Dear Sunita, our coordination network has verified a credible sighting of Rahul near the Park Metro station concourse at 5:15 PM. 8 authorized volunteers are actively searching the sector in coordination with local authorities. We will update you the moment new verified intelligence is confirmed."
            </p>
          ) : (
            <p className="font-sans text-sm text-slate-400 italic">
              "A new progress update is currently undergoing mandatory human coordinator review. To protect privacy and prevent misinformation, unverified rumors are never displayed here."
            </p>
          )}

          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5">
            <span>Status: {isApproved ? 'Signed by Coordinator Alex V.' : 'In Review at Approval Gate'}</span>
            <span className="text-emerald-400">✓ Strict Privacy Safeguards Enforced</span>
          </div>
        </div>

        {/* Emergency Direct Line */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs">
          <span className="text-slate-300">Direct Case Officer Emergency Line:</span>
          <span className="font-bold text-cyan-300">+1 (800) 555-LOST</span>
        </div>
      </div>
    </div>
  );
};
