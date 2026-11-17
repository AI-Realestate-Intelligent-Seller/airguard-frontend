"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import type { MotionValue } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ringBrandLabel, ringCards, type RingCard } from "@/data/hero-ring";
import { cn } from "@/lib/utils";
import { UNCOIL_SPEED, pathAt, railX, uncoilPath } from "@/lib/uncoil-path";

/*
 * A ring of cards wrapped around the viewer, spinning slowly — adapted from
 * scroller.html. Every card sits on a cylinder of radius R and faces its centre;
 * the camera looks up at it from below, so cards curve up and toward you at the edges.
 *
 * Geometry lives on a fixed design box (DESIGN_W × DESIGN_H) that is scaled to fit.
 */
const DESIGN_W = 1172;
const DESIGN_H = 430;
const CARD_W = 150;
const CARD_H = 290;
const CENTER_Y = 236; // card centre, in design px
const COUNT = 33;
const STEP = 360 / COUNT;
const R = 920;
const CULL = 42; // degrees from front beyond which a card is hidden
const FADE_FROM = 33;
const BASE_SPEED = -2.2; // deg/s
const HOVER_SPEED = -0.7;
const DRAG_GAIN = 0.075; // degrees per design px dragged
const CIRCLE_SPEED = -7; // deg/s once the arc has become the orbit
// The finished ring is a true circle of cards packed edge to edge round a hollow
// centre, each pointing outward like a spoke (a fanned deck), framing the headline.
const HEADER_H = 72; // keep the circle clear of the fixed header
const WHEEL_GAP = 1.02; // inner-rim length per card, relative to the card width
/** How far the circle spreads (× its size) as it hands off to Our World. */
export const WHEEL_SPREAD = 2.2;

/** The finished circle in viewport px: centre, hollow (inner) radius and outer radius. */
export function wheelGeometry(w: number, h: number) {
  const cx = w / 2;
  const cy = (h + HEADER_H) / 2;
  const outer = Math.max(120, Math.min(w * 0.46, (h - HEADER_H) / 2 - 12));
  // Cards touch along the inner rim, so the ring is as thick as one card is tall.
  const inner = outer / (1 + ((2 * Math.PI) / COUNT / WHEEL_GAP) * (CARD_H / CARD_W));
  return { cx, cy, inner, outer };
}

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Each brand's accent and studio surface. */
const BRAND_STYLE: Record<RingCard["brand"], { surface: string; accent: string; ink: string; floor: string }> = {
  airguard: { surface: "linear-gradient(172deg,#ffffff 0%,#f3f6fb 55%,#dfe7f4 100%)", accent: "#4067b1", ink: "#172236", floor: "#1f3a6e" },
  "king-hydrogen": { surface: "linear-gradient(172deg,#ffffff 0%,#f4f5f8 55%,#e1e4ec 100%)", accent: "#a8873e", ink: "#141821", floor: "#0d1119" },
  "arcane-herb": { surface: "linear-gradient(172deg,#fdfbf6 0%,#f5f0e4 55%,#e8dcc4 100%)", accent: "#8a6a35", ink: "#2d2213", floor: "#4a3518" },
  books: { surface: "linear-gradient(172deg,#ffffff 0%,#f3f5f9 55%,#e2e7f0 100%)", accent: "#4067b1", ink: "#172236", floor: "#172236" },
};

function Card({ card }: { card: RingCard }) {
  const st = BRAND_STYLE[card.brand];
  const book = card.brand === "books";
  return (
    <>
      <div className="absolute inset-0" style={{ background: st.surface }} />
      <div className="absolute inset-x-0 top-0 px-3.5 pt-3.5">
        <p className="flex items-center gap-1.5 text-[8px] font-medium uppercase tracking-[0.14em]" style={{ color: st.accent }}>
          <span className="h-px w-3" style={{ background: st.accent }} />
          {ringBrandLabel[card.brand]}
        </p>
        <p className="mt-1.5 text-[15px] font-semibold leading-tight" style={{ color: st.ink }}>
          {card.title}
        </p>
        <p className="mt-0.5 text-[9.5px] leading-snug" style={{ color: `${st.ink}99` }}>
          {card.note}
        </p>
      </div>
      {/* the product, standing on a soft floor shadow (white photo backgrounds melt into the surface) */}
      <div
        aria-hidden="true"
        className="absolute bottom-[30px] left-1/2 h-3 w-[62%] -translate-x-1/2 rounded-[50%] opacity-25 blur-md"
        style={{ background: st.floor }}
      />
      <div className={book ? "absolute inset-x-8 top-[88px] bottom-[34px]" : "absolute inset-x-3 top-[92px] bottom-[30px]"}>
        <Image
          src={card.src}
          alt=""
          fill
          sizes="200px"
          quality={90}
          loading="eager"
          draggable={false}
          className={book ? "rounded-[3px] object-contain shadow-[0_12px_20px_-8px_rgba(23,34,54,0.55)]" : "object-contain mix-blend-multiply"}
        />
      </div>
      <p className="absolute bottom-2.5 left-3.5 text-[8.5px] font-medium" style={{ color: st.accent }}>
        View →
      </p>
    </>
  );
}

export function HeroRing({
  reducedMotion,
  paused,
  morph,
  exit,
  drain,
  className,
}: {
  reducedMotion: boolean;
  paused: boolean;
  /** 0 = the curved arc, 1 = a complete flat circle centred in the viewport. */
  morph?: MotionValue<number>;
  /** 0 → 1 as the hero hands off: the orbit swells and fades away. */
  exit?: MotionValue<number>;
  /** 0 → 1 as the hero hands off, in step with the scroll: the ring breaks open at 9 o'clock and
      uncoils, its cards running out through the break in one strip, full size and evenly spaced,
      straight down and over the hero's bottom edge. */
  drain?: MotionValue<number>;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Animation state lives in refs: the ring re-positions every frame without re-rendering React.
  const s = useRef({
    phase: -24,
    vel: -46, // fast entrance spin that settles to the cruise speed
    target: BASE_SPEED,
    k: 1,
    visible: true,
    drag: null as null | { x: number; phase: number; lastX: number; lastT: number; v: number },
    moved: false,
    /** Ring phase when the uncoiling began: from then on the ring turns only with the scroll. */
    drainPhase: null as number | null,
  });
  const flags = useRef({ reducedMotion, paused, morph, exit, drain });
  useEffect(() => {
    flags.current = { reducedMotion, paused, morph, exit, drain };
  }, [reducedMotion, paused, morph, exit, drain]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const st = s.current;

    const place = () => {
      const m = flags.current.morph?.get() ?? 0;
      const ex = flags.current.exit?.get() ?? 0;
      const dr = flags.current.drain?.get() ?? 0;
      if (dr <= 0) st.drainPhase = null;
      else if (st.drainPhase === null) st.drainPhase = st.phase;
      const path =
        dr > 0 && m > 0
          ? (() => {
              const g0 = wheelGeometry(window.innerWidth, window.innerHeight);
              return uncoilPath(window.innerWidth, window.innerHeight, railX(g0.cx - (g0.inner + g0.outer) / 2));
            })()
          : null;

      // Circle geometry, in design px.
      let ocx = 0;
      let ocy = 0;
      let rMid = 0;
      let cs = 1;
      if (m > 0) {
        const box = wrap.getBoundingClientRect();
        const g = wheelGeometry(window.innerWidth, window.innerHeight);
        // The circle rides with the hero once it scrolls away (0 while the hero is pinned).
        const heroTop = wrap.closest("section")?.getBoundingClientRect().top ?? 0;
        ocx = (g.cx - box.left - wrap.clientWidth / 2) / st.k;
        ocy = (g.cy + heroTop - box.top) / st.k - CENTER_Y;
        const inner = (g.inner / st.k) * (1 + WHEEL_SPREAD * smooth(ex));
        cs = (2 * Math.PI * inner) / COUNT / WHEEL_GAP / CARD_W;
        rMid = inner + (CARD_H * cs) / 2;
      }

      for (let i = 0; i < COUNT; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const a = (((i * STEP + st.phase) % 360) + 540) % 360 - 180;
        const abs = Math.abs(a);
        // Front cards bend first; the ones behind the viewer close the circle last.
        const mi = m > 0 ? smooth((m - (0.45 * abs) / 180) / 0.55) : 0;
        if (abs > CULL && mi <= 0) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          continue;
        }

        // Pose on the cylinder (the arc), clamped so off-screen cards don't fly in from behind the camera.
        const ac = Math.max(-CULL - 8, Math.min(CULL + 8, a));
        const r = (ac * Math.PI) / 180;
        const c = Math.cos(r);
        const edge = abs > CULL ? 0 : abs > FADE_FROM ? 1 - (abs - FADE_FROM) / (CULL - FADE_FROM) : 1;
        const bright = Math.min(1.12, 0.92 + 0.45 * (1 / c - 1));

        if (mi <= 0) {
          el.style.visibility = "visible";
          el.style.transform = `translate3d(${(R * Math.sin(r)).toFixed(2)}px,0,${(R * (1 - c)).toFixed(2)}px) rotateY(${(-ac).toFixed(2)}deg)`;
          el.style.opacity = edge.toFixed(3);
          el.style.filter = `brightness(${bright.toFixed(3)})`;
          continue;
        }

        // Pose on the circle: the front card rises to the top, upright; the rest fan
        // round it, every card's top pointing outward.
        let ar = (a * Math.PI) / 180;
        let ox = ocx + rMid * Math.sin(ar);
        let oy = ocy - rMid * Math.cos(ar);
        let orz = a;
        if (dr > 0 && path) {
          // Uncoiling, in step with the scroll (the ring no longer turns on its own). It breaks at
          // 9 o'clock: each card runs round to the break, then down the shared path (a straight
          // run, a small curve just above the hero's bottom edge, over onto the Journey's rail),
          // keeping its size and spacing. All in viewport px, then back into design px.
          const a0 = i * STEP + (st.drainPhase ?? st.phase); // where it was when the ring broke
          const toBreak = ((((a0 + 90) % 360) + 360) % 360) * (Math.PI / 180) * path.mid;
          const left = toBreak - dr * UNCOIL_SPEED * window.innerHeight;
          if (left >= 0) {
            const ad = -90 + (left / path.mid) * (180 / Math.PI);
            ar = (ad * Math.PI) / 180;
            ox = ocx + rMid * Math.sin(ar);
            oy = ocy - rMid * Math.cos(ar);
            orz = ad;
          } else {
            const p = pathAt(path.points, -left);
            ox = ocx + (p.x - path.g.cx) / st.k;
            oy = ocy + (p.y - path.g.cy) / st.k;
            orz = p.angle - 180; // square to the path: a spoke at the break, flat heading down
          }
        }
        // Cards outside the visible arc grow in at their spot on the wheel instead.
        const w = clamp01((abs - FADE_FROM) / (CULL + 8 - FADE_FROM));
        const sx = lerp(R * Math.sin(r), ox, w);
        const sy = lerp(0, oy, w);
        const sz = lerp(R * (1 - c), 0, w);
        const sry = lerp(-ac, 0, w);
        const srz = lerp(0, orz, w);
        const ssc = lerp(1, cs * 0.35, w);

        const x = lerp(sx, ox, mi);
        const y = lerp(sy, oy, mi);
        const z = lerp(sz, 0, mi);
        const ry3 = lerp(sry, 0, mi);
        const rz = lerp(srz, orz, mi);
        const sc = lerp(ssc, cs, mi);
        // The spreading wheel stays solid at first, then thins out as it leaves the screen.
        const op = lerp(edge, 1, mi) * (1 - smooth((ex - 0.3) / 0.7));

        if (op < 0.004) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateY(${ry3.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        el.style.opacity = op.toFixed(3);
        el.style.filter = `brightness(${lerp(bright, 1, mi).toFixed(3)})`;
      }
    };

    // Fit the design box to the available width.
    const fit = () => {
      // Width sets the scale; on short screens, height caps it so the ring fits the stage.
      const w = wrap.clientWidth;
      const byHeight = (window.innerHeight - 320) / DESIGN_H;
      const k = Math.max(0.68, Math.min(1, w / DESIGN_W, byHeight));
      st.k = k;
      wrap.style.setProperty("--ring-k", k.toFixed(4));
    };
    fit();
    place();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    window.addEventListener("resize", fit);

    const io = new IntersectionObserver(([e]) => (st.visible = e.isIntersecting));
    io.observe(wrap);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const { reducedMotion: rm, paused: p, morph: mv, drain: dv } = flags.current;
      if (st.visible && !st.drag) {
        // While uncoiling, the ring turns with the scroll alone.
        if (!rm && !((dv?.get() ?? 0) > 0)) {
          // The closed circle turns a little faster than the arc.
          const goal = p ? 0 : lerp(st.target, CIRCLE_SPEED, mv?.get() ?? 0);
          st.vel += (goal - st.vel) * (1 - Math.exp(-dt * 1.4));
          st.phase += st.vel * dt;
        }
        place();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Drag-to-spin, tracked on window so a click on a card still reaches its link.
    const onMove = (e: globalThis.PointerEvent) => {
      const d = st.drag;
      if (!d) return;
      const dx = (e.clientX - d.x) / st.k;
      if (Math.abs(dx) > 4) st.moved = true;
      st.phase = d.phase + dx * DRAG_GAIN;
      const t = performance.now();
      const dtm = Math.max(1, t - d.lastT);
      d.v = (((e.clientX - d.lastX) / st.k) * DRAG_GAIN * 1000) / dtm;
      d.lastX = e.clientX;
      d.lastT = t;
      place();
    };
    const onUp = () => {
      if (!st.drag) return;
      st.vel = Math.max(-90, Math.min(90, st.drag.v));
      st.drag = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const st = s.current;
    st.moved = false;
    st.drag = { x: e.clientX, phase: st.phase, lastX: e.clientX, lastT: performance.now(), v: 0 };
  };

  // A drag should spin the ring, not open the card under the pointer.
  const onClickCapture = (e: MouseEvent) => {
    if (s.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      s.current.moved = false;
    }
  };

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn("hero-ring relative w-full select-none", className)}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
      onPointerEnter={(e) => e.pointerType === "mouse" && (s.current.target = HOVER_SPEED)}
      onPointerLeave={() => (s.current.target = BASE_SPEED)}
      style={{ height: `calc(var(--ring-k, 1) * ${DESIGN_H}px)` }}
    >
      <div
        className="hero-ring-box"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          perspective: "900px",
          perspectiveOrigin: `${DESIGN_W / 2}px ${CENTER_Y + 300}px`,
        }}
      >
        {Array.from({ length: COUNT }, (_, i) => {
          const card = ringCards[i % ringCards.length];
          return (
            <Link
              key={i}
              href={card.href}
              tabIndex={-1}
              draggable={false}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="hero-ring-card"
              style={{
                left: DESIGN_W / 2 - CARD_W / 2,
                top: CENTER_Y - CARD_H / 2,
                width: CARD_W,
                height: CARD_H,
                visibility: "hidden",
              }}
            >
              <Card card={card} />
              <span className="hero-ring-edge" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
