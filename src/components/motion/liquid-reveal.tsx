"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useIsDark } from "@/hooks/use-is-dark";
import type { Sea } from "./sea";

/*
 * Two ways for a section to come up out of the liquid of the particle story above it. Both play
 * each time the section comes into view, leave no clip, tint or canvas behind, and are skipped
 * under reduced motion. Each watches an unclipped wrapper: a fully clipped element never counts
 * as visible.
 *
 *  DropReveal  (King Hydrogen) the particle drop from the story above lands in the section and
 *              becomes the sea, which spreads out and sinks to the bottom, revealing the section.
 *  WaveReveal  (Arcane Herb) the section rises out of a layer of tea: a moving wave line climbs from
 *              the bottom to the top with a tint of the tea that clears as it rises. ~1.2 s.
 */

type Hide = () => void;
type Play = () => void;

/** Shared wiring: hide until mostly in view, play, reset once fully out of view. */
function useRevealOnView(outer: React.RefObject<HTMLDivElement | null>, setup: () => { hide: Hide; play: Play; dispose: () => void } | null, threshold: number, deps: unknown[]) {
  useEffect(() => {
    const host = outer.current;
    if (!host) return;
    const r = setup();
    if (!r) return;
    let state: "hidden" | "played" = "hidden";
    r.hide();
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= threshold && state === "hidden") {
          state = "played";
          r.play();
        } else if (!e.isIntersecting && state !== "hidden") {
          state = "hidden";
          r.hide();
        }
      },
      { threshold: [0, threshold] }
    );
    io.observe(host);
    return () => {
      io.disconnect();
      r.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-set up only when the listed inputs change
  }, deps);
}

/**
 * The particle drop that forms at the end of the Genesis story is carried down into King Hydrogen
 * (particle-bridge.tsx). While it is on its way the section waits for it, and when it lands the
 * section opens from that point.
 */
type Land = (x: number, y: number) => void;
const landers = new Set<Land>();
export const dropBus = {
  /** A drop is falling: the King Hydrogen reveal holds until it lands. */
  incoming: false,
  /** The drop has landed at (x, y), in viewport px. */
  land(x: number, y: number) {
    dropBus.incoming = false;
    landers.forEach((f) => f(x, y));
  },
  on(f: Land) {
    landers.add(f);
    return () => void landers.delete(f);
  },
};

const SPREAD = 900; // ms for the drop's water to spread out to both sides and down
const DOWN_FROM = 650; // when the sea starts to sink towards the bottom
const DOWN = 1600; // ms for its top edge to reach the bottom
const END = DOWN_FROM + DOWN + 150;
/** Where the drop lands when none is handed over (fraction of the first screen, from the top). */
const LAND_AT = 0.38;

/**
 * King Hydrogen: the Genesis drop (drop-carry.ts) falls into the section's own white background and
 * becomes the sea (sea.ts, a WebGL shader): water spreads out from where it landed, to both sides and
 * down, and then its top edge (a line of foam) sinks to the bottom of the screen, the product display
 * appearing above it as it goes. Scrolled to by hand, with no drop on its way, the water starts from
 * the same point all the same. Without WebGL the section simply shows.
 */
export function DropReveal({ base, children }: { base: { light: string; dark: string }; children: ReactNode }) {
  const reduce = useMotionPreference();
  const dark = useIsDark();
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = outer.current;
    const el = inner.current;
    const canvas = canvasRef.current;
    if (!host || !el || !canvas || reduce) return;
    let sea: Sea | null = null;
    let cancelled = false;
    let raf = 0;
    let state: "hidden" | "waiting" | "played" | "done" = "hidden";
    let landed = 0; // when the drop landed (performance.now)
    let from = { x: 0.5, y: LAND_AT }; // where, as fractions of the first screen
    const t0 = performance.now();
    let H = 1;

    const size = () => {
      H = Math.min(el.offsetHeight, innerHeight); // the water covers the first screen
      canvas.style.height = `${H}px`;
      sea?.resize(el.offsetWidth, H);
    };
    const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
    const easeInOut = (k: number) => k * k * (3 - 2 * k);

    const finish = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      state = "done";
      canvas.style.display = "none";
      el.style.clipPath = "none";
      el.style.opacity = "";
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!sea) return;
      // development only: window.__seaAt freezes the water at that many ms after landing, for visual checks
      const fixed = process.env.NODE_ENV === "development" ? (window as unknown as { __seaAt?: number }).__seaAt : undefined;
      const since = fixed ?? Math.max(0, now - landed);
      const sp = easeOut(Math.min(1, since / SPREAD));
      const dn = easeInOut(Math.min(1, Math.max(0, since - DOWN_FROM) / DOWN));
      const edge = from.y + (1.06 - from.y) * dn;
      sea.render({
        time: (now - t0) / 1000,
        edge,
        cx: from.x,
        hw: 0.01 + 1.4 * sp,
        depth: 0.01 + 1.6 * Math.pow(sp, 1.4),
      });
      // the display: everything above the sea's edge (just under its foam), fading in as the water spreads
      const cut = Math.max(0, el.offsetHeight - (edge + 0.014) * H);
      el.style.clipPath = `inset(0 0 ${cut}px 0)`;
      el.style.opacity = String(Math.min(1, since / SPREAD));
      if (since >= END) finish();
    };

    const hide = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      state = "hidden";
      el.style.clipPath = sea ? "inset(0 0 100% 0)" : "none";
      el.style.opacity = "";
      canvas.style.display = "none";
    };
    /** The drop has landed at (x, y) in viewport px (or the default point): the water takes over from there. */
    const land = (x?: number, y?: number) => {
      state = "played";
      if (!sea) return finish();
      size();
      const r = el.getBoundingClientRect();
      from =
        x === undefined || y === undefined
          ? { x: 0.5, y: LAND_AT }
          : { x: Math.min(0.9, Math.max(0.1, (x - r.left) / el.offsetWidth)), y: Math.min(0.7, Math.max(0.12, (y - r.top) / H)) };
      landed = performance.now();
      canvas.style.display = "block";
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    };

    // the shader is small; load it before the section arrives so the first frame is ready
    import("./sea").then(({ mountSea }) => {
      if (cancelled) return;
      sea = mountSea(canvas, dark);
      if (state === "hidden") hide();
    });

    const off = dropBus.on((x, y) => {
      if (state === "played" || state === "done") return;
      land(x, y);
    });
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && state === "hidden") state = "waiting";
        // with no drop on its way, the water starts once the section is mostly in view
        if (e.intersectionRatio >= 0.45 && state === "waiting" && !dropBus.incoming) land();
        else if (!e.isIntersecting && state !== "hidden") hide();
      },
      { threshold: [0, 0.45] }
    );
    io.observe(host);
    const onResize = () => sea && size();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      io.disconnect();
      off();
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      sea?.dispose();
      el.style.clipPath = "";
      el.style.opacity = "";
    };
  }, [reduce, dark]);

  if (reduce) return <>{children}</>;
  return (
    <div ref={outer} className="relative" style={{ background: dark ? base.dark : base.light }}>
      <div ref={inner} className="relative">
        {children}
      </div>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[70] hidden w-full" />
    </div>
  );
}

/** Arcane Herb: rises out of a layer of tea on a moving wave line, with a tint that clears. */
export function WaveReveal({ tint, children }: { tint: string; children: ReactNode }) {
  const reduce = useMotionPreference();
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);

  useRevealOnView(
    outer,
    () => {
      const el = inner.current;
      const tintEl = veil.current;
      if (!el || !tintEl || reduce) return null;
      let raf = 0;
      const wave = (level: number, phase: number, amp: number) => {
        const pts: string[] = [];
        for (let i = 0; i <= 24; i++) {
          const x = (i / 24) * 100;
          const y = level + Math.sin((x / 100) * Math.PI * 4 + phase) * amp + Math.sin((x / 100) * Math.PI * 1.5 - phase * 0.6) * amp * 0.6;
          pts.push(`${x}% ${Math.max(-10, Math.min(110, y))}%`);
        }
        return `polygon(${pts.join(", ")}, 100% 110%, 0% 110%)`;
      };
      const hide = () => {
        cancelAnimationFrame(raf);
        el.style.clipPath = wave(104, 0, 3);
        tintEl.style.opacity = "0.6";
        tintEl.style.display = "block";
      };
      const play = () => {
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / 1200);
          const p = 1 - Math.pow(1 - t, 3);
          el.style.clipPath = wave(104 - p * 114, now / 260, 3.2 * (1 - p * 0.7));
          tintEl.style.opacity = String(0.6 * (1 - p));
          if (t < 1) raf = requestAnimationFrame(step);
          else {
            el.style.clipPath = "none";
            tintEl.style.display = "none";
          }
        };
        raf = requestAnimationFrame(step);
      };
      return { hide, play, dispose: () => cancelAnimationFrame(raf) };
    },
    0.06,
    [reduce]
  );

  if (reduce) return <>{children}</>;
  return (
    <div ref={outer}>
      <div ref={inner} className="relative">
        {children}
        <div
          ref={veil}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[60]"
          style={{ background: `linear-gradient(180deg, ${tint}cc 0%, ${tint}66 40%, transparent 85%)` }}
        />
      </div>
    </div>
  );
}
