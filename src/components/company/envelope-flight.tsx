"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useT } from "@/i18n/locale";

/*
 * Contact form send-off. A large envelope lifts off the Send button and flies slowly through the
 * whole screen in wide loops, leaving a smoke trail like a plane's contrail; it ends in the
 * centre, shrinks away in a soft flash, and the confirmation card opens from that point.
 *
 * Smoke is particles on one canvas (cheap at 60 fps); the envelope is a DOM element placed each
 * frame along a Catmull-Rom spline through points around the screen, turned to its heading.
 * Reduced motion: no flight, the card appears at once.
 */

type Pt = { x: number; y: number };
const FLIGHT_MS = 5200;

function catmull(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) * 0.55 + t * 0.45;

export function EnvelopeFlight({
  from,
  reduce,
  summary,
  onClose,
}: {
  /** Where the envelope takes off (the Send button), in viewport px. */
  from: Pt | null;
  reduce: boolean;
  /** What was asked about, shown on the card. */
  summary: string;
  onClose: () => void;
}) {
  // Mounted once per send (the parent keys it), so the first phase follows straight from the props.
  const tr = useT();
  const [phase, setPhase] = useState<"flying" | "card">(() => (reduce || !from ? "card" : "flying"));
  const flight = phase === "flying" ? 1 : 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);


  // The flight
  useEffect(() => {
    if (!flight || !from) return; // runs once: `flight` only ever goes 1 → 0
    const canvas = canvasRef.current!;
    const env = envRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const small = W < 640;
    const size = small ? 120 : 190;
    env.style.width = env.style.height = `${size}px`;

    // a wide tour of the screen, ending in the centre
    const pts: Pt[] = [
      from,
      { x: W * 0.78, y: H * 0.18 },
      { x: W * 0.2, y: H * 0.3 },
      { x: W * 0.84, y: H * 0.62 },
      { x: W * 0.22, y: H * 0.82 },
      { x: W * 0.36, y: H * 0.46 },
      { x: W * 0.5, y: H * 0.5 },
    ];
    const ctrl = [pts[0], ...pts, pts[pts.length - 1]];
    const segs = pts.length - 1;
    const at = (u: number): Pt => {
      const s = Math.min(segs - 1, Math.floor(u * segs));
      return catmull(ctrl[s], ctrl[s + 1], ctrl[s + 2], ctrl[s + 3], u * segs - s);
    };

    type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number };
    const smoke: P[] = [];
    const start = performance.now();
    let raf = 0;
    let last = start;
    let done = false;
    let lastTail: Pt | null = null;

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const t = Math.min(1, Math.max(0, (now - start) / FLIGHT_MS)); // rAF time can precede start
      const u = ease(t);
      const p = at(u);
      const q = at(Math.min(1, u + 0.004));
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      // grow on take-off, shrink into the centre at the end
      const scale = t < 0.12 ? 0.35 + (t / 0.12) * 0.65 : t > 0.86 ? Math.max(0, 1 - (t - 0.86) / 0.14) : 1;

      if (!done) {
        env.style.transform = `translate3d(${p.x - size / 2}px, ${p.y - size / 2}px, 0) rotate(${ang}rad) scale(${scale}, ${Math.cos(ang) < 0 ? -scale : scale})`; // stays upright when heading left
        env.style.opacity = String(Math.min(1, scale * 1.4));
        // contrail from the tail
        // contrail from the tail: puffs laid evenly along the distance flown since the last
        // frame, so the trail stays continuous at any frame rate
        if (scale > 0.05) {
          const tail = { x: p.x - Math.cos(ang) * size * 0.42 * scale, y: p.y - Math.sin(ang) * size * 0.42 * scale };
          const from = lastTail ?? tail;
          const n = Math.max(1, Math.min(40, Math.round(Math.hypot(tail.x - from.x, tail.y - from.y) / 5)));
          for (let i = 0; i < n; i++) {
            const k = (i + 1) / n;
            smoke.push({
              x: from.x + (tail.x - from.x) * k + (Math.random() - 0.5) * 8 * scale,
              y: from.y + (tail.y - from.y) * k + (Math.random() - 0.5) * 8 * scale,
              vx: -Math.cos(ang) * 12 + (Math.random() - 0.5) * 16,
              vy: -Math.sin(ang) * 12 + (Math.random() - 0.5) * 16 - 6,
              r: (small ? 6 : 9) * (0.6 + scale * 0.6),
              life: -(1 - k) * dt, // older puffs first
              max: 2.2 + Math.random() * 1.2,
            });
          }
          lastTail = tail;
        }
      }

      ctx.clearRect(0, 0, W, H);
      for (let i = smoke.length - 1; i >= 0; i--) {
        const s = smoke[i];
        s.life += dt;
        if (s.life > s.max) {
          smoke.splice(i, 1);
          continue;
        }
        const k = s.life / s.max;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.97;
        s.vy *= 0.97;
        const r = s.r * (1 + k * 4.5);
        const a = 0.32 * (1 - k) * (1 - k);
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        g.addColorStop(0, `rgba(226,232,244,${a})`);
        g.addColorStop(0.6, `rgba(200,212,232,${a * 0.5})`);
        g.addColorStop(1, "rgba(200,212,232,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (t >= 1 && !done) {
        done = true;
        env.style.opacity = "0";
        setPhase("card");
      }
      if (!done || smoke.length) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one flight per mount
  }, []);

  // Escape closes the card; focus moves into it.
  useEffect(() => {
    if (phase !== "card") return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      {/* veil */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "card" ? 1 : 0.55 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-[#0a1424]/60 backdrop-blur-[2px]"
        onClick={phase === "card" ? onClose : undefined}
      />
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />

      {/* stays mounted (hidden) after landing so the flight loop can finish its smoke */}
      <div ref={envRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 origin-center opacity-0 will-change-transform">
        {!reduce && <Envelope />}
      </div>

      {/* the flash where it vanishes, then the card from the same point */}
      <AnimatePresence>
        {phase === "card" && (
          <>
            {!reduce && (
              <motion.span
                key="flash"
                aria-hidden="true"
                initial={{ opacity: 0.9, scale: 0.2 }}
                animate={{ opacity: 0, scale: 3 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1/2 -ml-20 -mt-20 size-40 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,.95),rgba(140,200,240,.4),transparent)]"
              />
            )}
            <div key="wrap" className="pointer-events-none absolute inset-0 grid place-items-center p-4">
              <motion.div
                ref={cardRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sent-title"
                tabIndex={-1}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
                className="pointer-events-auto relative w-full max-w-md rounded-[28px] border border-white/60 bg-[#fff] p-7 text-center shadow-[0_40px_100px_-30px_rgba(10,20,36,.7)] outline-none dark:border-white/10 dark:bg-[#13213a]"
              >
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={tr("Close")}
                  className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-[#5b6b80] hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
                >
                  <X className="size-4" />
                </button>
                <SentMark reduce={reduce} />
                <h2 id="sent-title" className="mt-5 text-2xl font-medium tracking-tight text-[#172236] dark:text-white">
                  {tr("Your inquiry has been submitted")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#5b6b80] dark:text-white/70">
                  {tr("Thank you. A member of our team will be in touch with you promptly.")}
                </p>
                {summary && (
                  <p className="mx-auto mt-4 w-fit max-w-full rounded-full bg-[#eef3fb] px-4 py-1.5 text-xs text-[#2b3f63] dark:bg-white/10 dark:text-white/80">{summary}</p>
                )}
                <Link
                  href="/"
                  data-cta="primary"
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#172236] px-6 text-sm font-medium text-white hover:bg-[#2b3f63] dark:bg-brand-500"
                >
                  {tr("Browse products")}
                  <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}

/** A big envelope with a pointed nose and swept wings, so it reads as flying. */
function Envelope() {
  return (
    <svg viewBox="0 0 160 160" className="size-full drop-shadow-[0_18px_24px_rgba(10,20,36,.45)]">
      <defs>
        <linearGradient id="env-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe7f3" />
        </linearGradient>
        <linearGradient id="env-flap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b82c9" />
          <stop offset="1" stopColor="#4067b1" />
        </linearGradient>
      </defs>
      {/* swept wings (the envelope flies to the right; rotation turns it to its heading) */}
      <path d="M40 58 L8 30 L58 52 Z" fill="#c9d6ec" />
      <path d="M40 102 L8 130 L58 108 Z" fill="#b7c7e4" />
      {/* body */}
      <rect x="30" y="50" width="100" height="60" rx="8" fill="url(#env-body)" stroke="#c4d1e6" />
      {/* lower folds */}
      <path d="M30 110 L80 78 L130 110" fill="none" stroke="#c4d1e6" strokeWidth="2" />
      {/* flap */}
      <path d="M32 52 L80 86 L128 52 Z" fill="url(#env-flap)" />
      {/* seal */}
      <circle cx="80" cy="84" r="9" fill="#fff" stroke="#4067b1" strokeWidth="2" />
      <path d="M76 84 l3 3 l5 -6" fill="none" stroke="#4067b1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* nose arrow */}
      <path d="M130 66 L150 80 L130 94" fill="none" stroke="#4067b1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Check mark that draws itself inside a ring. */
function SentMark({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="mx-auto size-16" aria-hidden="true">
      <motion.circle
        cx="32"
        cy="32"
        r="29"
        fill="none"
        stroke="#4067b1"
        strokeWidth="3"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
      />
      <motion.path
        d="M20 33 l8 8 l16 -18"
        fill="none"
        stroke="#4067b1"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}
