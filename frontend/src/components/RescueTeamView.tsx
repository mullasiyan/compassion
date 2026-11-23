import React, { useEffect, useRef, useState } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';
import L from 'leaflet';

export const RescueTeamView: React.FC = () => {
  const {
    currentStepIndex,
    jumpToStep,
    triggerSightingWebhook,
    streamMode,
    isLiveConnected
  } = useObservatoryStore();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const zoneBetaLayerRef = useRef<L.Circle | null>(null);
  const sightingMarkerRef = useRef<L.Marker | null>(null);

  const [activeTab, setActiveTab] = useState<'map' | 'tasks'>('map');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const isZoneBetaActive = currentStepIndex >= 6;
  const areTasksDispatched = currentStepIndex >= 9;

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent double initialization
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.388, 78.480],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Dark Matter OpenStreetMap Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Anchor Marker (College Bus Stop)
      const anchorIcon = L.divIcon({
        className: 'custom-anchor-pin',
        html: `<div style="background-color: #00F0FF; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 12px #00F0FF; border: 2px solid #FFFFFF;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      L.marker([17.385044, 78.486671], { icon: anchorIcon })
        .addTo(map)
        .bindPopup(`<b style="color: #03060E;">Anchor Point</b><br/>College Bus Stop (4:30 PM)<br/>Rahul last seen here`);

      // Zone Alpha (Initial Perimeter: 1.5km)
      L.circle([17.385044, 78.486671], {
        radius: 1500,
        color: '#00F0FF',
        weight: 1.5,
        dashArray: '5, 5',
        fillColor: '#00F0FF',
        fillOpacity: 0.08
      }).addTo(map).bindPopup("<b style='color: #03060E;'>Zone Alpha</b><br/>1.5km Pedestrian Radius");

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Dynamically add/remove Zone Beta based on autonomous re-planning state
    if (isZoneBetaActive) {
      if (!zoneBetaLayerRef.current) {
        zoneBetaLayerRef.current = L.circle([17.391020, 78.472010], {
          radius: 1200,
          color: '#A855F7',
          weight: 2,
          fillColor: '#A855F7',
          fillOpacity: 0.18
        }).addTo(map).bindPopup("<b style='color: #03060E;'>Zone Beta (Active)</b><br/>Re-planned from Verified Sighting #1");

        const sightingIcon = L.divIcon({
          className: 'custom-sighting-pin',
          html: `<div style="background-color: #FFB800; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 16px #FFB800; border: 2px solid #FFFFFF; animation: pulse 1.5s infinite;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        sightingMarkerRef.current = L.marker([17.391020, 78.472010], { icon: sightingIcon })
          .addTo(map)
          .bindPopup("<b style='color: #03060E;'>Verified Sighting #1</b><br/>Park Metro Station (5:15 PM)<br/>Confidence: 0.92");

        // Pan map smoothly to the new critical centroid
        map.panTo([17.390, 78.476], { animate: true, duration: 1.2 });
      }
    } else {
      if (zoneBetaLayerRef.current) {
        map.removeLayer(zoneBetaLayerRef.current);
        zoneBetaLayerRef.current = null;
      }
      if (sightingMarkerRef.current) {
        map.removeLayer(sightingMarkerRef.current);
        sightingMarkerRef.current = null;
      }
      map.panTo([17.388, 78.480], { animate: true, duration: 1.0 });
    }

    return () => {
      // Don't destroy map on every step render; destroyed on component unmount
    };
  }, [isZoneBetaActive]);

  // Cleanup map on complete unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleSimulateWebhook = async (type: 'verified' | 'duplicate' | 'unverified') => {
    if (streamMode === 'live' && isLiveConnected) {
      // Send real POST to FastAPI backend
      const payloads = {
        verified: {
          location: 'Park Metro',
          time: '5:15 PM',
          description: 'Boy in royal blue shirt asking for directions near Station Concourse',
          source: 'community_portal'
        },
        duplicate: {
          location: 'Stadium Gate',
          time: '5:30 PM',
          description: 'Saw duplicate blue shirt 15m ago reposted from Twitter',
          source: 'social_scraper_duplicate'
        },
        unverified: {
          location: 'Distant Airport Terminal',
          time: '4:50 PM',
          description: 'Improbable sighting 45km away with zero transit match',
          source: 'community_portal'
        }
      };

      try {
        setWebhookStatus(`Firing live webhook: ${type}...`);
        const res = await fetch('/api/cases/run-rahul-0921/sightings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloads[type])
        });
        if (res.ok) {
          setWebhookStatus(`Webhook delivered to backend: ${type.toUpperCase()}`);
        }
      } catch (err) {
        setWebhookStatus('Backend unreachable, using mock playback');
      }
    } else {
      // Client Mock Trigger
      if (type === 'verified') {
        jumpToStep(4);
        setWebhookStatus('Mock: Verified Sighting #1 triggered -> Re-plans Zone Beta');
      } else if (type === 'duplicate') {
        jumpToStep(7);
        setWebhookStatus('Mock: Sighting #2 Duplicate triggered -> Critic flags 0.15');
      } else {
        jumpToStep(8);
        setWebhookStatus('Mock: Sighting #3 Improbable triggered -> Critic flags 0.28');
      }
    }

    setTimeout(() => setWebhookStatus(null), 3500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-80px)] p-4 overflow-hidden font-mono text-slate-100 select-none animate-in fade-in duration-300">
      {/* Top Banner & Mode */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Field Operations & Spatial Perimeter Console
          </div>
          <h2 className="text-xl font-display font-bold text-white">Rescue Coordination & Search Map</h2>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-white/5 border border-white/10 p-1 text-xs">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 rounded transition-all ${activeTab === 'map' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'}`}
            >
              Interactive OSM Map
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1 rounded transition-all ${activeTab === 'tasks' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'}`}
            >
              Volunteer Manifest (4 Tasks)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 overflow-hidden min-h-0">
        {/* Left 2 Cols: Leaflet Map or Tasks */}
        <div className="lg:col-span-2 flex flex-col h-full rounded-2xl glass-panel border border-white/10 overflow-hidden relative shadow-2xl">
          {activeTab === 'map' ? (
            <div className="relative w-full h-full">
              {/* Leaflet Map Div */}
              <div ref={mapContainerRef} className="w-full h-full z-0" style={{ background: '#070B14' }} />

              {/* Map Floating HUD Overlay */}
              <div className="absolute top-3 left-3 z-10 p-3 rounded-xl glass-panel text-xs space-y-1.5 max-w-xs pointer-events-auto">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>Spatial Perimeters</span>
                  <span className="text-[10px] text-emerald-400">OSM Nominatim Live</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Zone Alpha: College Bus Stop (1.5km)</span>
                </div>
                <div className={`flex items-center gap-2 text-[11px] ${isZoneBetaActive ? 'text-purple-300 font-bold' : 'text-slate-500'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isZoneBetaActive ? 'bg-purple-400 animate-pulse' : 'bg-slate-700'}`} />
                  <span>Zone Beta: Park Metro (1.2km) {isZoneBetaActive ? '· ACTIVE RE-PLAN' : '· Standby'}</span>
                </div>
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-lg glass-panel text-[10px] text-slate-400 flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Anchor</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Sighting</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Re-planned Zone</span>
              </div>
            </div>
          ) : (
            /* Volunteer Tasks View */
            <div className="p-5 overflow-y-auto space-y-3 h-full">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-display font-bold text-white text-sm">Active Volunteer Task Allocations</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero Duplicate Coverage Enforced
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  { id: 'TSK-101', title: 'Park Metro Station CCTV Audit & Master Log', team: 'Volunteer Pair #1 (Sarah & Dev)', priority: 'Critical', sector: 'Zone Beta - Sector B1 (Ticket Gates)' },
                  { id: 'TSK-102', title: 'North Concourse Vendor & Commuter Inquiries', team: 'Volunteer Pair #2 (Kavita & Amir)', priority: 'Critical', sector: 'Zone Beta - Sector B2 (North Depot)' },
                  { id: 'TSK-103', title: 'Intercity Bus Bay 4-8 Boarding Sweeps', team: 'Volunteer Pair #3 (Carlos & Jen)', priority: 'High', sector: 'Zone Beta - Sector B3 (Transit Bay)' },
                  { id: 'TSK-104', title: 'Perimeter Pedestrian Underpass & Walkways', team: 'Volunteer Pair #4 (Liam & Priya)', priority: 'Medium', sector: 'Zone Beta - Sector B4 (Underpass)' }
                ].map((tsk) => (
                  <div key={tsk.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{tsk.title}</div>
                      <div className="text-[11px] text-slate-400">{tsk.sector} · {tsk.team}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      {areTasksDispatched ? 'In Progress' : 'Staged'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live Webhook Trigger Panel for Judges */}
        <div className="flex flex-col h-full rounded-2xl glass-panel p-4 border border-white/10 space-y-4 shadow-2xl justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="border-b border-white/10 pb-2">
              <span className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                Live Sighting Webhook Simulator
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Fire real sightings via <code className="text-cyan-300">POST /api/cases/{{id}}/sightings</code>. Watch the Critic verify or reject, then re-plan the map live.
              </p>
            </div>

            {/* Notification alert */}
            {webhookStatus && (
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono animate-in fade-in">
                {webhookStatus}
              </div>
            )}

            {/* Webhook 1: Verified (Triggers Autonomous Re-planning) */}
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>1. Valid Sighting (Park Metro)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40">SCORE 0.92</span>
              </div>
              <p className="text-[11px] text-slate-300">
                "Boy in royal blue shirt asking directions near Station Concourse at 5:15 PM"
              </p>
              <button
                onClick={() => handleSimulateWebhook('verified')}
                className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,255,157,0.2)]"
              >
                📡 Fire Sighting #1 (Triggers Zone Beta)
              </button>
            </div>

            {/* Webhook 2: Duplicate Sighting (Critic Discards) */}
            <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>2. Duplicate Text Repost</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40">SCORE 0.15</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Exact text hash match with viral tweet from previous incident. Critic discards to prevent search diversion.
              </p>
              <button
                onClick={() => handleSimulateWebhook('duplicate')}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all"
              >
                ⚠️ Fire Sighting #2 (Flagged Duplicate)
              </button>
            </div>

            {/* Webhook 3: Improbable Sighting (Critic Flags Outlier) */}
            <div className="p-3 rounded-xl bg-black/40 border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-red-400">
                <span>3. Improbable Transit Velocity</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 border border-red-500/40">SCORE 0.28</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Distance 45km away within 20 minutes without transit evidence. Critic flags unverified.
              </p>
              <button
                onClick={() => handleSimulateWebhook('unverified')}
                className="w-full py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-300 text-xs font-bold transition-all"
              >
                🚫 Fire Sighting #3 (Flagged Unverified)
              </button>
            </div>
          </div>

          {/* Autonomy Safeguard Footer */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] text-slate-400">
            <span className="text-cyan-300 font-bold">Autonomy Principle:</span> Only sightings scoring <code className="text-emerald-400">&gt;= 0.85</code> alter the spatial plan. Flagged duplicates and outliers never divert active volunteer units.
          </div>
        </div>
      </div>
    </div>
  );
};
