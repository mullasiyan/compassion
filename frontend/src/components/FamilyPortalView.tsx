import React, { useState, useEffect } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';

export const FamilyPortalView: React.FC = () => {
  const { currentStepIndex, streamMode, isLiveConnected } = useObservatoryStore();
  const [liveNotifs, setLiveNotifs] = useState<any[]>([]);

  const isApproved = currentStepIndex >= 12;

  useEffect(() => {
    if (streamMode === 'live' && isLiveConnected) {
      const fetchNotifs = async () => {
        try {
          const res = await fetch('/api/cases/run-rahul-0921/notifications');
          if (res.ok) {
            const data = await res.json();
            setLiveNotifs(data.notifications || []);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 4000);
      return () => clearInterval(interval);
    }
  }, [streamMode, isLiveConnected]);

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto font-mono text-slate-100 select-none animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="border-b border-white/10 pb-4 flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            Family & Guardian Liaison Console
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Case Support & Direct Status Feed</h2>
          <p className="text-xs text-slate-400 mt-1">
            Encrypted updates prepared by the Family Liaison Agent and signed by human coordinators.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Case Subject</span>
          <span className="text-base font-bold text-white">Rahul (Age 16)</span>
          <span className="text-[10px] block text-cyan-400">Anchor: College Bus Stop</span>
        </div>
      </div>

      {/* Main Official Dispatch Card */}
      <div className="glass-panel p-6 rounded-3xl border border-pink-500/30 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-[0_0_8px_#FF007A]" />
            <span className="text-xs text-pink-300 font-bold uppercase tracking-wider">Latest Verified Guardian Memo</span>
          </div>
          <span className="text-[10px] text-slate-400">Updated: Today 5:25 PM</span>
        </div>

        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-xs text-slate-200 leading-relaxed space-y-3">
          {isApproved || liveNotifs.length > 0 ? (
            <div className="space-y-2">
              <p className="font-sans text-sm text-slate-100 leading-relaxed">
                "{liveNotifs[0]?.message || 'Dear Sunita, our coordination network has verified a credible sighting of Rahul near the Park Metro station concourse at 5:15 PM. 8 authorized volunteers are actively searching the sector in coordination with local authorities. We will update you the moment new verified intelligence is confirmed.'}"
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
                <span className="text-emerald-400 font-bold">✓ Signed by Coordinator Alex V.</span>
                <span>Delivered to Guardian: Smt. Sunita</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <p className="font-sans text-sm text-slate-400 italic">
                "A new progress update is currently awaiting mandatory human coordinator sign-off at the approval gate. To prevent misinformation, unverified leads are never shown here."
              </p>
              <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Pending Human Coordinator Review</span>
              </div>
            </div>
          )}
        </div>

        {/* Ethical Redaction Statement */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-slate-300">Privacy Safeguards Enforced:</span>
          <span className="text-emerald-400">Zero Facial Recognition · Live GPS Redacted · Verified Facts Only</span>
        </div>
      </div>

      {/* Emergency Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Local Police Dispatch</span>
          <div className="text-base font-bold text-white">Dial 100 / 911</div>
          <p className="text-[10px] text-slate-400">Station Crime Liaison Officer informed</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Child Emergency Line</span>
          <div className="text-base font-bold text-cyan-300">Dial 1098 (24/7)</div>
          <p className="text-[10px] text-slate-400">Dedicated juvenile crisis wing</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">LostLink Family Coordinator</span>
          <div className="text-base font-bold text-pink-300">+1 (800) 555-LOST</div>
          <p className="text-[10px] text-slate-400">Direct desk of Lead Coordinator Alex</p>
        </div>
      </div>
    </div>
  );
};
