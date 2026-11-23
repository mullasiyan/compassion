import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  layer: number; // 0: far, 1: mid, 2: near
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  maxAlpha: number;
  decay: number;
}

export const StarfieldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Offscreen canvas for pre-rendered static starfield
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    const stars: Star[] = [];
    const STAR_COUNT = width < 768 ? 160 : 320;

    const starColors = [
      '#FFFFFF',
      '#E0F2FE', // Ice blue
      '#FEF3C7', // Solar amber tint
      '#DDD6FE', // Nebula violet tint
      '#BAE6FD'  // Cyan tint
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = Math.random() < 0.6 ? 0 : Math.random() < 0.85 ? 1 : 2;
      const size = layer === 0 ? Math.random() * 0.8 + 0.3 : layer === 1 ? Math.random() * 1.0 + 0.8 : Math.random() * 1.4 + 1.4;
      const baseAlpha = layer === 0 ? Math.random() * 0.3 + 0.15 : layer === 1 ? Math.random() * 0.4 + 0.35 : Math.random() * 0.4 + 0.6;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        baseAlpha,
        alpha: baseAlpha,
        layer,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    // Pre-render Layer 0 (Distant stationary stars) onto offscreen canvas for extreme performance
    if (offscreenCtx) {
      offscreenCtx.clearRect(0, 0, width, height);
      for (const s of stars) {
        if (s.layer === 0) {
          offscreenCtx.fillStyle = s.color;
          offscreenCtx.globalAlpha = s.baseAlpha;
          offscreenCtx.beginPath();
          offscreenCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          offscreenCtx.fill();
        }
      }
    }

    // Dynamic shooting stars array
    const shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();

    const spawnShootingStar = () => {
      if (prefersReducedMotion) return;
      const startX = Math.random() * width * 0.8 + width * 0.1;
      const startY = Math.random() * height * 0.3;
      shootingStars.push({
        x: startX,
        y: startY,
        length: Math.random() * 90 + 70,
        speed: Math.random() * 8 + 12,
        angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1), // ~45 deg descent
        alpha: 1.0,
        maxAlpha: 1.0,
        decay: Math.random() * 0.02 + 0.015
      });
    };

    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw pre-rendered distant starfield
      if (offscreenCanvas) {
        ctx.globalAlpha = 1.0;
        ctx.drawImage(offscreenCanvas, 0, 0);
      }

      // 2. Draw animated mid & near stars with gentle organic twinkling
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (s.layer === 0) continue; // Layer 0 is on offscreen canvas

        if (!prefersReducedMotion) {
          s.alpha = s.baseAlpha + Math.sin(time * s.twinkleSpeed * 60 + s.twinkleOffset) * 0.25;
          s.alpha = Math.max(0.08, Math.min(1.0, s.alpha));
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        // Prominent foreground star flare cross
        if (s.layer === 2 && s.size > 2.0) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = s.alpha * 0.45;
          ctx.beginPath();
          ctx.moveTo(s.x - s.size * 2.5, s.y);
          ctx.lineTo(s.x + s.size * 2.5, s.y);
          ctx.moveTo(s.x, s.y - s.size * 2.5);
          ctx.lineTo(s.x, s.y + s.size * 2.5);
          ctx.stroke();
        }
      }

      // 3. Update & render shooting stars
      const now = Date.now();
      if (!prefersReducedMotion && now - lastShootingStarTime > 6000 && Math.random() < 0.02) {
        spawnShootingStar();
        lastShootingStarTime = now;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.alpha -= ss.decay;

        if (ss.alpha <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        grad.addColorStop(0.7, 'rgba(0, 240, 255, 0.4)');
        grad.addColorStop(1, `rgba(255, 255, 255, ${ss.alpha})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        // Comet head point
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = ss.alpha;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;

      if (offscreenCtx) {
        offscreenCtx.clearRect(0, 0, width, height);
        for (const s of stars) {
          s.x = (s.x / (canvas.width || 1)) * width;
          s.y = (s.y / (canvas.height || 1)) * height;
          if (s.layer === 0) {
            offscreenCtx.fillStyle = s.color;
            offscreenCtx.globalAlpha = s.baseAlpha;
            offscreenCtx.beginPath();
            offscreenCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            offscreenCtx.fill();
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Dynamic Canvas Stars */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Cosmic Nebula Backlight Gradients */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 15% 25%, rgba(168, 85, 247, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(0, 240, 255, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 75% 20%, rgba(255, 0, 122, 0.05) 0%, transparent 40%)
          `
        }}
      />

      {/* Cinematic Edge Vignette */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 65%, rgba(2, 4, 10, 0.85) 100%)'
        }}
      />
    </div>
  );
};
