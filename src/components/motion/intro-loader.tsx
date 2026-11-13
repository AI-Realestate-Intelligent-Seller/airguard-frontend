"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';

/*
 * Cinematic intro, ported from airguard-cinematic-demo.html.
 *
 * Timeline (seconds): a glowing helix spins (0–2.8), unwinds into a line
 * (2.8–4.2), the line splits to frame the AirGuard logo (3.8–5.0), a flare
 * blooms (5.7–6.4), then the overlay lifts away and the page sharpens into view.
 *
 * Plays on every page load, with no skip. Visitors who ask their system for
 * reduced motion go straight to the page.
 */

// Light theme in AirGuard blue (#4067B1). The demo's originals were neon cyan
// on near-black: ribbon #05efff → #25d4fa → #153dff, line #00f2ff → #d6ffff → #1c48ff.
const COLORS = {
  ribbon: ['#5b80c8', '#4067b1', '#385998'] as const,
  line: ['#4067b1', '#7d9bd6', '#4067b1'] as const,
  glowFront: 'rgba(64,103,177,0.55)',
  glowBack: 'rgba(64,103,177,0.3)',
  glowLine: 'rgba(64,103,177,0.6)',
};

const INTRO_SECONDS = 6.65;
const REVEAL_MS = 2000;

// The ending is eased out: once the logo is fully in (5.0s) it holds for a
// moment, then the line retracts, flare and lift-off play ~40% slower.
const LOGO_IN = 5.0;
const LOGO_HOLD = 0.6;
const TAIL_SPEED = 0.7;
const timeline = (t: number) =>
  t < LOGO_IN ? t : t < LOGO_IN + LOGO_HOLD ? LOGO_IN : LOGO_IN + (t - LOGO_IN - LOGO_HOLD) * TAIL_SPEED;

type Phase = 'intro' | 'reveal' | 'done';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x: number) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};

export function IntroLoader({
  children,
  logoSrc,
  className = '',
}: {
  children: ReactNode;
  /** The AirGuard logo (shield + wordmark), shown when the line splits. */
  logoSrc: string;
  /** Classes for the wrapper around the page content. */
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>('intro');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (reduced || !canvas || !ctx) {
      // Nothing to play: show the page on the next frame
      const id = requestAnimationFrame(() => setPhase('done'));
      return () => cancelAnimationFrame(id);
    }

    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = Math.max(window.innerHeight, 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.49;
      const mobile = w < 650;
      const scale = Math.min(w / 1050, h / 740, 1.2);
      const radius = (mobile ? 95 : 130) * Math.min(scale * 1.19, 1);
      const height = (mobile ? 230 : 355) * Math.min(scale * 1.08, 1);
      const morph = smooth((t - 2.77) / 1.22);
      const opacity = 1 - smooth((t - 4.24) / 0.6);
      const drift = t * 0.7;

      // Helix that unwinds into a flat line
      if (t < 4.8 && opacity > 0.003) {
        const pts = Array.from({ length: 440 }, (_, i) => {
          const u = i / 439;
          const a = u * Math.PI * 2 * 3.95 + drift - 0.85;
          const taper = 0.77 + 0.23 * Math.sin(Math.PI * u);
          const rx = Math.sin(a) * radius * taper;
          const ry = (u - 0.5) * height + Math.cos(a) * 5;
          return {
            x: cx + rx * (1 - morph) + (u - 0.5) * (mobile ? 270 : 465) * morph,
            y: cy + ry * (1 - morph),
            z: Math.cos(a),
          };
        });
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const grad = ctx.createLinearGradient(cx - radius * 1.15, cy, cx + radius * 1.15, cy);
        grad.addColorStop(0, COLORS.ribbon[0]);
        grad.addColorStop(0.45, COLORS.ribbon[1]);
        grad.addColorStop(1, COLORS.ribbon[2]);
        // Four batched strokes (back/front × glow/core) keep it smooth on phone GPUs
        const strand = (front: boolean, glowPass: boolean) => {
          ctx.beginPath();
          let pen = false;
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1];
            const b = pts[i];
            const visible = (a.z + b.z) * 0.5 > -0.02;
            if (morph < 0.96 && visible !== front) {
              pen = false;
              continue;
            }
            if (!pen) {
              ctx.moveTo(a.x, a.y);
              pen = true;
            }
            ctx.lineTo(b.x, b.y);
          }
          ctx.strokeStyle = grad;
          ctx.shadowColor = front ? COLORS.glowFront : COLORS.glowBack;
          ctx.shadowBlur = glowPass ? 34 : 16;
          ctx.lineWidth = (glowPass ? 24 : 10.5) * (1 - 0.69 * morph) + 2.3 * morph;
          ctx.globalAlpha = opacity * (front ? 1 : 0.48) * (glowPass ? 0.3 : 0.94);
          ctx.stroke();
        };
        strand(false, true);
        strand(false, false);
        strand(true, true);
        strand(true, false);
        ctx.restore();
      }

      // The straight line splits open to make room for the logo
      if (t >= 3.75 && t < 6.4) {
        const grow = smooth((t - 3.75) / 0.5);
        const open = smooth((t - 4.45) / 0.55);
        const retract = smooth((t - 5.45) / 0.85);
        const halfWidth = (mobile ? 147 : 258) * grow * (1 - 0.65 * retract);
        const gap = (mobile ? 113 : 182) * open * (1 - 0.45 * retract);
        ctx.save();
        ctx.translate(cx, cy);
        const grad = ctx.createLinearGradient(-300, 0, 300, 0);
        grad.addColorStop(0, COLORS.line[0]);
        grad.addColorStop(0.5, COLORS.line[1]);
        grad.addColorStop(1, COLORS.line[2]);
        ctx.strokeStyle = grad;
        ctx.lineCap = 'round';
        ctx.shadowColor = COLORS.glowLine;
        ctx.shadowBlur = 23;
        ctx.lineWidth = 4.2;
        for (const sign of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(sign * gap, 0);
          ctx.lineTo(sign * halfWidth, 0);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 19;
        ctx.shadowBlur = 30;
        for (const sign of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(sign * gap, 0);
          ctx.lineTo(sign * halfWidth, 0);
          ctx.stroke();
        }
        ctx.restore();
      }

      const lp = smooth((t - 4.27) / 0.65) * (1 - smooth((t - 6.03) / 0.43));
      if (logoRef.current) {
        logoRef.current.style.opacity = lp.toFixed(3);
        logoRef.current.style.transform = `translateY(${(1 - lp) * 8}px) scale(${(0.92 + 0.08 * lp).toFixed(3)})`;
      }
      const bright = smooth((t - 5.72) / 0.58) * (1 - smooth((t - 6.4) / 0.45));
      if (flareRef.current) {
        flareRef.current.style.opacity = (bright * 0.9).toFixed(3);
        flareRef.current.style.transform = `scale(${1 + (bright * Math.max(w, h)) / 125})`;
      }
    };

    let raf = 0;
    let done = false;
    let timer = 0;
    const start = performance.now();
    const reveal = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      setPhase('reveal');
      timer = window.setTimeout(() => {
        root.style.overflow = prevOverflow;
        setPhase('done');
      }, REVEAL_MS);
    };

    const frame = (now: number) => {
      const t = timeline((now - start) / 1000);
      draw(t);
      if (t >= INTRO_SECONDS) reveal();
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);


    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
      root.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <>
      <div className={`ag-intro-content ${className}`} data-phase={phase}>
        {children}
      </div>

      {phase !== 'done' && (
        <div
          className={`ag-intro ${phase === 'reveal' ? 'is-done' : ''}`}
          role="presentation"
          aria-hidden={phase === 'reveal' || undefined}
        >
          <div className="ag-intro-topline">AIRGUARD &nbsp; / &nbsp; THE FUTURE OF PROTECTION</div>
          <canvas ref={canvasRef} className="ag-intro-canvas" aria-hidden="true" />
          <div ref={logoRef} className="ag-intro-logo" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps this overlay framework-free */}
            <img src={logoSrc} alt="" draggable={false} />
          </div>
          <div ref={flareRef} className="ag-intro-flare" />
          <div className="ag-intro-coordinates">ADVANCED CHAIRSIDE PROTECTION &nbsp; · &nbsp; EST. 2020</div>
        </div>
      )}
    </>
  );
}
