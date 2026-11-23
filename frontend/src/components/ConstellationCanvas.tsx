import React, { useRef, useEffect, useState } from 'react';
import { useObservatoryStore } from '../store/useObservatoryStore';
import { AGENT_REGISTRY } from '../mock/scriptedDemo';
import { AgentRole } from '../types';

interface ParticleSim {
  id: string;
  from: AgentRole;
  to: AgentRole;
  progress: number; // 0 to 1
  speed: number;
  label: string;
  payloadPreview: string;
  color: string;
}

export const ConstellationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    agentStates,
    selectedAgent,
    setSelectedAgent,
    activeParticles,
    isApprovalModalOpen,
    isFailureSimulated
  } = useObservatoryStore();

  const [hoveredEntity, setHoveredEntity] = useState<{
    type: 'agent' | 'particle';
    x: number;
    y: number;
    title: string;
    subtitle: string;
  } | null>(null);

  // Active traveling particles simulation array
  const liveParticlesRef = useRef<ParticleSim[]>([]);

  // Sync new particles from store
  useEffect(() => {
    if (activeParticles.length > 0) {
      activeParticles.forEach((p) => {
        // Add if not already present
        if (!liveParticlesRef.current.some(lp => lp.id === p.id)) {
          liveParticlesRef.current.push({
            id: p.id,
            from: p.from,
            to: p.to,
            progress: 0,
            speed: 0.0075 + Math.random() * 0.003,
            label: p.label,
            payloadPreview: p.payloadPreview,
            color: p.color
          });
        }
      });
    }
  }, [activeParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Handle high-DPI
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Seed background stars
    const stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.002 + 0.001
      });
    }

    // Main 60 FPS animation loop
    const render = () => {
      time += 0.025;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // 1. Clear background
      ctx.fillStyle = '#03060E';
      ctx.fillRect(0, 0, w, h);

      // 2. Draw subtle starfield
      stars.forEach((star) => {
        const starAlpha = Math.abs(Math.sin(time * star.speed * 10 + star.x * 20)) * star.alpha;
        ctx.fillStyle = `rgba(180, 210, 255, ${starAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Constellation Network Lines between Orchestrator and specialized agents
      const orchMeta = AGENT_REGISTRY.orchestrator;
      const ox = (orchMeta.xPercent / 100) * w;
      const oy = (orchMeta.yPercent / 100) * h;

      (Object.keys(AGENT_REGISTRY) as AgentRole[]).forEach((role) => {
        if (role === 'orchestrator') return;
        const meta = AGENT_REGISTRY[role];
        const ax = (meta.xPercent / 100) * w;
        const ay = (meta.yPercent / 100) * h;

        // Curved constellation backbone
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        const midX = (ox + ax) / 2 + Math.sin(time + meta.xPercent) * 12;
        const midY = (oy + ay) / 2 + Math.cos(time + meta.yPercent) * 12;
        ctx.quadraticCurveTo(midX, midY, ax, ay);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 4. Update and Draw Traveling Message Particles
      for (let i = liveParticlesRef.current.length - 1; i >= 0; i--) {
        const p = liveParticlesRef.current[i];
        p.progress += p.speed;

        const fromMeta = AGENT_REGISTRY[p.from];
        const toMeta = AGENT_REGISTRY[p.to];
        const fx = (fromMeta.xPercent / 100) * w;
        const fy = (fromMeta.yPercent / 100) * h;
        const tx = (toMeta.xPercent / 100) * w;
        const ty = (toMeta.yPercent / 100) * h;

        // Quadratic curve control point
        const cx = (fx + tx) / 2 + (fy - ty) * 0.18;
        const cy = (fy + ty) / 2 + (tx - fx) * 0.18;

        // Current particle position along quadratic bezier
        const t = p.progress;
        const invT = 1 - t;
        const px = invT * invT * fx + 2 * invT * t * cx + t * t * tx;
        const py = invT * invT * fy + 2 * invT * t * cy + t * t * ty;

        // Glow trail
        const gradient = ctx.createRadialGradient(px, py, 1, px, py, 12);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Remove finished particle
        if (p.progress >= 1.0) {
          liveParticlesRef.current.splice(i, 1);
        }
      }

      // 5. Draw Agent Orbs
      (Object.keys(AGENT_REGISTRY) as AgentRole[]).forEach((role) => {
        const meta = AGENT_REGISTRY[role];
        const state = agentStates[role];
        const ax = (meta.xPercent / 100) * w;
        const ay = (meta.yPercent / 100) * h;
        const isSelected = selectedAgent === role;
        const isOrch = role === 'orchestrator';
        const isHoldAgent = isApprovalModalOpen && role === 'family_communication';
        const isFailed = role === 'verification' && isFailureSimulated;

        const baseRadius = isOrch ? 32 : 22;

        // --- MOTION STATES ---
        // Idle: breathing glow
        let breathing = Math.sin(time * 2 + meta.xPercent) * 2;
        let radius = baseRadius + breathing;

        // State: Thinking (expanding ripple rings)
        if (state.status === 'thinking') {
          for (let r = 0; r < 3; r++) {
            const rippleR = baseRadius + ((time * 25 + r * 15) % 40);
            const rippleAlpha = 1 - (rippleR - baseRadius) / 40;
            ctx.beginPath();
            ctx.arc(ax, ay, rippleR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 240, 255, ${rippleAlpha * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // State: Working (orbiting sub-particles)
        if (state.status === 'working') {
          for (let s = 0; s < 3; s++) {
            const orbitAngle = time * 3 + (s * (Math.PI * 2)) / 3;
            const orbitDist = baseRadius + 12;
            const sx = ax + Math.cos(orbitAngle) * orbitDist;
            const sy = ay + Math.sin(orbitAngle) * orbitDist;
            ctx.fillStyle = meta.color;
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Orchestrator Center: Rotating Rings & Satellite Tasks
        if (isOrch) {
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(time * 0.6);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 48, 20, Math.PI / 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.rotate(-time * 1.2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 42, 16, -Math.PI / 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Approval Gate: Amber Halo "HOLD" event
        if (isHoldAgent) {
          const haloPulse = 8 + Math.sin(time * 5) * 6;
          ctx.beginPath();
          ctx.arc(ax, ay, radius + haloPulse + 12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 184, 0, 0.25)';
          ctx.fill();
          ctx.strokeStyle = '#FFB800';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Simulated Failure: Red flicker crack effect
        if (isFailed) {
          const flicker = Math.random() > 0.3 ? 1 : 0.2;
          ctx.fillStyle = `rgba(239, 68, 68, ${0.4 * flicker})`;
          ctx.beginPath();
          ctx.arc(ax, ay, radius + 15, 0, Math.PI * 2);
          ctx.fill();

          // Crack lines
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ax - 12, ay - 8);
          ctx.lineTo(ax - 2, ay + 2);
          ctx.lineTo(ax + 4, ay - 6);
          ctx.lineTo(ax + 14, ay + 10);
          ctx.stroke();
        }

        // Core Orb Outer Radial Glow
        const orbGlow = ctx.createRadialGradient(ax, ay, 2, ax, ay, radius * 1.8);
        const orbColor = isFailed ? '#EF4444' : meta.color;
        orbGlow.addColorStop(0, orbColor);
        orbGlow.addColorStop(0.6, isFailed ? 'rgba(239,68,68,0.4)' : meta.glowColor);
        orbGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = orbGlow;
        ctx.beginPath();
        ctx.arc(ax, ay, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Core Orb Body
        ctx.fillStyle = isFailed ? '#7F1D1D' : '#0B1120';
        ctx.beginPath();
        ctx.arc(ax, ay, radius, 0, Math.PI * 2);
        ctx.fill();

        // 1px Luminous Border
        ctx.strokeStyle = isSelected ? '#FFFFFF' : orbColor;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Agent Role Label under Orb
        ctx.font = '500 11px "Space Grotesk", sans-serif';
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#CBD5E1';
        ctx.textAlign = 'center';
        ctx.fillText(meta.name, ax, ay + radius + 18);

        // Status Sub-badge
        ctx.font = '400 9px "JetBrains Mono", monospace';
        ctx.fillStyle = isFailed ? '#F87171' : state.status === 'working' ? '#4ADE80' : '#94A3B8';
        ctx.fillText(isFailed ? 'FAILED (RETRY)' : state.status.toUpperCase(), ax, ay + radius + 30);
      });

      // 6. Dim Canvas when Approval Modal is active
      if (isApprovalModalOpen) {
        ctx.fillStyle = 'rgba(3, 6, 14, 0.72)';
        ctx.fillRect(0, 0, w, h);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse Click & Hover Handlers
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      (Object.keys(AGENT_REGISTRY) as AgentRole[]).forEach((role) => {
        const meta = AGENT_REGISTRY[role];
        const ax = (meta.xPercent / 100) * w;
        const ay = (meta.yPercent / 100) * h;
        const dist = Math.hypot(x - ax, y - ay);
        if (dist <= 36) {
          setSelectedAgent(role);
        }
      });
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      let found = false;

      // Check agent hover
      (Object.keys(AGENT_REGISTRY) as AgentRole[]).forEach((role) => {
        const meta = AGENT_REGISTRY[role];
        const ax = (meta.xPercent / 100) * w;
        const ay = (meta.yPercent / 100) * h;
        const dist = Math.hypot(x - ax, y - ay);
        if (dist <= 32) {
          setHoveredEntity({
            type: 'agent',
            x: ax,
            y: ay,
            title: meta.name,
            subtitle: `${meta.roleTitle} · Click to inspect trace`
          });
          found = true;
        }
      });

      // Check particle hover
      if (!found) {
        liveParticlesRef.current.forEach((p) => {
          const fromMeta = AGENT_REGISTRY[p.from];
          const toMeta = AGENT_REGISTRY[p.to];
          const fx = (fromMeta.xPercent / 100) * w;
          const fy = (fromMeta.yPercent / 100) * h;
          const tx = (toMeta.xPercent / 100) * w;
          const ty = (toMeta.yPercent / 100) * h;
          const cx = (fx + tx) / 2 + (fy - ty) * 0.18;
          const cy = (fy + ty) / 2 + (tx - fx) * 0.18;

          const t = p.progress;
          const invT = 1 - t;
          const px = invT * invT * fx + 2 * invT * t * cx + t * t * tx;
          const py = invT * invT * fy + 2 * invT * t * cy + t * t * ty;

          if (Math.hypot(x - px, y - py) <= 18) {
            setHoveredEntity({
              type: 'particle',
              x: px,
              y: py,
              title: `${fromMeta.name} → ${toMeta.name}: ${p.label}`,
              subtitle: p.payloadPreview
            });
            found = true;
          }
        });
      }

      if (!found) {
        setHoveredEntity(null);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
    };
  }, [agentStates, selectedAgent, isApprovalModalOpen, isFailureSimulated, setSelectedAgent]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Interactive Hover Tooltip */}
      {hoveredEntity && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3.5 py-2 rounded-xl glass-panel text-left max-w-xs shadow-2xl transition-all"
          style={{ left: hoveredEntity.x, top: hoveredEntity.y }}
        >
          <div className="text-xs font-display font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            {hoveredEntity.title}
          </div>
          <div className="text-[11px] font-mono text-slate-300 mt-1 leading-snug">
            {hoveredEntity.subtitle}
          </div>
        </div>
      )}
    </div>
  );
};
