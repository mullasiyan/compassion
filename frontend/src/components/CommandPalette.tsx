import React, { useState, useEffect } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    toggleCommandPalette,
    togglePlay,
    triggerSightingWebhook,
    triggerSimulateFailure,
    toggleSound,
    setRoleView,
    resetRun,
    setScreen
  } = useObservatoryStore();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, toggleCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  const commands = [
    {
      id: 'play_demo',
      title: 'Run Scripted Rahul Demo',
      category: 'Mission Control',
      action: () => {
        setScreen('observatory');
        togglePlay();
        toggleCommandPalette();
      }
    },
    {
      id: 'webhook_sighting',
      title: 'Fire Sighting Webhook (Park Metro - 5:15 PM)',
      category: 'Triggers & Webhooks',
      action: () => {
        setScreen('observatory');
        triggerSightingWebhook();
        toggleCommandPalette();
      }
    },
    {
      id: 'sim_failure',
      title: 'Simulate Critic Failure & Self-Healing Backoff',
      category: 'Reliability & Demo Safety',
      action: () => {
        triggerSimulateFailure();
        toggleCommandPalette();
      }
    },
    {
      id: 'view_observatory',
      title: 'Switch View: AI Agent Observatory',
      category: 'Navigation',
      action: () => {
        setScreen('observatory');
        setRoleView('observatory');
        toggleCommandPalette();
      }
    },
    {
      id: 'view_rescue',
      title: 'Switch View: Rescue Team Portal (Volunteer Sectors)',
      category: 'Navigation',
      action: () => {
        setScreen('observatory');
        setRoleView('rescue_team');
        toggleCommandPalette();
      }
    },
    {
      id: 'view_family',
      title: 'Switch View: Family Support Portal (Progress Memo)',
      category: 'Navigation',
      action: () => {
        setScreen('observatory');
        setRoleView('family_portal');
        toggleCommandPalette();
      }
    },
    {
      id: 'toggle_sound',
      title: 'Toggle Cyber Synth Sound Design',
      category: 'Settings',
      action: () => {
        toggleSound();
        toggleCommandPalette();
      }
    },
    {
      id: 'reset_mission',
      title: 'Reset Mission to Initial Intake',
      category: 'Mission Control',
      action: () => {
        resetRun();
        toggleCommandPalette();
      }
    }
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl glass-panel-glow rounded-2xl overflow-hidden border border-white/20 shadow-2xl space-y-2">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/40">
          <span className="text-cyan-400 font-mono text-sm mr-2.5">⌘</span>
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">ESC</kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-slate-500">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 text-left font-mono text-xs transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                  <span className="text-slate-200 group-hover:text-white font-medium">{cmd.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                  {cmd.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
