import React from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';

export const RescueTeamView: React.FC = () => {
  const { currentStepIndex } = useObservatoryStore();

  const isZoneBetaActive = currentStepIndex >= 6;
  const areTasksDispatched = currentStepIndex >= 9;

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl mx-auto font-mono text-slate-100 select-none animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Field Operations Console
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Rescue & Volunteer Coordination</h2>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-400">Target: <span className="text-white font-bold">Rahul (16)</span></div>
          <div className="text-emerald-400">8 Credentialed Volunteers Active</div>
        </div>
      </div>

      {/* Grid: Search Zones & Active Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Perimeters */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10">
          <h3 className="text-sm font-display font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span>Dynamic Search Zones</span>
            <span className="text-[10px] text-slate-400">Auto Re-planned via Sightings</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Zone Alpha */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Zone Alpha (Initial Perimeter)</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">1.5 km Radius</span>
              </div>
              <p className="text-slate-400 text-[11px]">Anchor: College Bus Stop · Swept by Team Alpha</p>
              <div className="text-[10px] text-emerald-400 font-semibold">Status: Sector Sweep Complete (Clear)</div>
            </div>

            {/* Zone Beta */}
            <div className={`p-3.5 rounded-xl border transition-all space-y-1.5 ${
              isZoneBetaActive
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-white/5 border-white/5 opacity-50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Zone Beta (Shifted Centroid)</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                  {isZoneBetaActive ? 'CRITICAL FOCUS' : 'LOCKED'}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">Anchor: Park Metro Station Concourse (Verified Sighting #1)</p>
              <div className="text-[10px] text-cyan-400 font-semibold">
                {isZoneBetaActive ? 'Re-planned from verified 5:15 PM sighting' : 'Awaiting Sighting Verification'}
              </div>
            </div>
          </div>
        </div>

        {/* Volunteer Task Manifest */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10">
          <h3 className="text-sm font-display font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
            <span>Volunteer Missions & Coverage</span>
            <span className="text-[10px] text-slate-400">Zero-Overlap Allocation</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {[
              { id: 'TSK-101', title: 'Station Master CCTV Audit', team: 'Volunteer Pair #1 (Sarah & Dev)', status: areTasksDispatched ? 'In Progress' : 'Staged' },
              { id: 'TSK-102', title: 'North Concourse Shop Sweeps', team: 'Volunteer Pair #2 (Kavita & Amir)', status: areTasksDispatched ? 'In Progress' : 'Staged' },
              { id: 'TSK-103', title: 'Bus Depot Bay 4-8 Inquiries', team: 'Volunteer Pair #3 (Carlos & Jen)', status: areTasksDispatched ? 'In Progress' : 'Staged' },
              { id: 'TSK-104', title: 'Perimeter Transit Underpass', team: 'Volunteer Pair #4 (Liam & Priya)', status: areTasksDispatched ? 'In Progress' : 'Staged' }
            ].map((task) => (
              <div key={task.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{task.title}</div>
                  <div className="text-[10px] text-slate-400">{task.id} · Assigned to {task.team}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  task.status === 'In Progress'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
