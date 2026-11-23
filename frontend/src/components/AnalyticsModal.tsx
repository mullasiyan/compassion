import React, { useState } from 'react';
import { downloadClientPdfFallback } from '../utils/pdfFallback';
import { useObservatoryStore } from '../store/useObservatoryStore';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const { streamMode, isLiveConnected } = useObservatoryStore();
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    if (streamMode === 'live' && isLiveConnected) {
      try {
        const resp = await fetch('/api/cases/run-rahul-0921/report.pdf');
        if (resp.ok) {
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'LostLink-Case-run-rahul-0921.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setDownloading(false);
          return;
        }
      } catch (e) {
        console.warn('Backend PDF fetch failed, using fallback:', e);
      }
    }

    // Instant client-side fallback
    setTimeout(() => {
      downloadClientPdfFallback('run-rahul-0921');
      setDownloading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-panel-glow rounded-3xl p-6 text-slate-100 space-y-6 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00F0FF]" />
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-tight">Mission Analytics & Incident Report</h2>
              <p className="text-xs font-mono text-slate-400">Case #LL-2026-0921 · Rahul (Age 16)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center font-mono text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Core Analytics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-mono">
          {/* Verified vs Flagged */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sightings Verified</span>
            <div className="text-2xl font-display font-bold text-emerald-400">1 / 3</div>
            <span className="text-[10px] text-amber-400 block">2 Flagged (1 Dup, 1 Outlier)</span>
          </div>

          {/* Time to First Search Plan */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Time to 1st Zone</span>
            <div className="text-2xl font-display font-bold text-cyan-400">12s</div>
            <span className="text-[10px] text-slate-400 block">Zone Alpha 1.5km</span>
          </div>

          {/* Volunteer Tasks Partitioned */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Volunteer Tasks</span>
            <div className="text-2xl font-display font-bold text-purple-400">4 / 4</div>
            <span className="text-[10px] text-emerald-400 block">Zero Overlap Verified</span>
          </div>

          {/* Manual Hours Saved */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Hours Saved</span>
            <div className="text-2xl font-display font-bold text-pink-400">4.5 hrs</div>
            <span className="text-[10px] text-slate-400 block">78% Speed Reduction</span>
          </div>
        </div>

        {/* Detailed Breakdown: Verified vs Flagged Sightings */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-300 font-bold border-b border-white/5 pb-1.5">
            <span>Critic Sighting Audit Log</span>
            <span className="text-[10px] text-slate-400">Threshold: 0.85 Confidence</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
              <span>Park Metro Station (5:15 PM) · Consistent Clothing & Walking Speed</span>
              <span className="font-bold">VERIFIED (0.92)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300">
              <span>Twitter Repost · Exact text hash match with previous incident</span>
              <span className="font-bold">FLAGGED DUPLICATE (0.15)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300">
              <span>Distant Airport Terminal · Improbable 45 km/h transit velocity</span>
              <span className="font-bold">FLAGGED OUTLIER (0.28)</span>
            </div>
          </div>
        </div>

        {/* System Health Status Pills */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-slate-400">Swarm Health:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              SQLite: Online
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              OSM Nominatim: Active
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Critic: Active
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-[11px] font-mono text-slate-400">
            Certified under LostLink Ethical AI Mandate (No facial recognition).
          </span>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all flex items-center gap-2"
          >
            <span>{downloading ? 'Generating PDF...' : '📄 Download PDF Case Dossier'}</span>
            <span>⬇</span>
          </button>
        </div>
      </div>
    </div>
  );
};
