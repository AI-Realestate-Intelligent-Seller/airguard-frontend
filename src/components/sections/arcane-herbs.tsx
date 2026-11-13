"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, Droplets, Leaf, Sprout } from "lucide-react";
import { Section } from "@/components/layout/section";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { arcaneHerbTeas, featuredArcaneHerbTeas } from "@/data/arcane-herb-products";

/*
 * Arcane Herbs, the last section, after the Book Store. Its film (upright, light) is played by the
 * scroll the same way as the Book Store's: frames drawn as part of the section, forward with the
 * scroll, back when scrolling up, easing to rest when the scroll stops. A sachet rises through a
 * splash of water, an old photograph of a family herb shop, then the tea is poured: "Arcane Herbs,
 * Chinese Classical Formulas. Pure herbs, pure healing."
 *  - Upright screens (phones): the film fills the screen; the words and blends follow it.
 *  - Wide screens: the whole film plays in a tall column on the right, beside the words (short
 *    screens leave out the blend pictures, then the three points, so the words always fit).
 */
const EASE = [0.16, 1, 0.3, 1] as const;
const FRAMES = 240;
const FILM_W = 720;
const FILM_H = 1280;
/** Share of the pinned scroll that plays the film; the rest holds its last frame. */
const PLAY = 0.85;
/** The film's own cream backdrop, so the section and film meet without a seam. */
const CREAM = "#ebe6dc";
const frameUrl = (i: number) => `/frames/arcane-herbs/${String(i + 1).padStart(3, "0")}.webp`;
const PORTRAIT_QUERY = "(max-aspect-ratio: 4/5)";

function useMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const read = () => setMatches(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [query]);
  return matches;
}

/**
 * Draws the film frame for the scroll position. `full`: fills the screen below the site bar (all of
 * the film's words in view) with its top edge carried up behind the bar. Otherwise the canvas is
 * a column already shaped like the film, and the film fills it exactly.
 */
function HerbFilm({ progress, full, still }: { progress: MotionValue<number>; full: boolean; still: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!frame || !canvas || !ctx) return;
    const images: (HTMLImageElement | null)[] = new Array(FRAMES).fill(null);
    let cancelled = false;
    let started = false;
    let dirty = true;

    // Coarse to fine, a few at a time; the last frame (the rest pose) first.
    const order: number[] = [FRAMES - 1];
    for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
    const load = () => {
      if (started) return;
      started = true;
      let next = 0;
      const pump = () => {
        if (cancelled || next >= order.length) return;
        const i = order[next++];
        const img = new window.Image();
        img.decoding = "async";
        img.src = frameUrl(i);
        img
          .decode()
          .then(() => {
            if (cancelled) return;
            images[i] = img;
            dirty = true;
          })
          .catch(() => {})
          .finally(pump);
      };
      for (let k = 0; k < 6; k++) pump();
    };
    const nearest = (i: number, dir: 1 | -1) => {
      for (let d = 0; d < FRAMES; d++) {
        const j = i + d * dir;
        if (j < 0 || j >= FRAMES) break;
        if (images[j]) return images[j];
      }
      return null;
    };

    let W = 0, H = 0, dpr = 1;
    const box = { x: 0, y: 0, w: 0, h: 0 };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = frame.clientWidth;
      H = frame.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const s = full ? Math.max(W / FILM_W, (H - 72) / FILM_H) : Math.max(W / FILM_W, H / FILM_H);
      box.w = FILM_W * s;
      box.h = FILM_H * s;
      box.x = (W - box.w) / 2;
      box.y = full ? H - box.h : (H - box.h) / 2;
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    resize();

    const paint = (img: HTMLImageElement) => {
      ctx.drawImage(img, box.x, box.y, box.w, box.h);
      if (box.y > 0.5) ctx.drawImage(img, 0, 0, img.naturalWidth, 18, box.x, 0, box.w, box.y + 1);
    };
    const draw = (pos: number) => {
      const i0 = Math.max(0, Math.min(FRAMES - 1, Math.floor(pos)));
      const frac = pos - i0;
      const a = nearest(i0, -1) || nearest(i0, 1);
      if (!a) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, W, H);
      paint(a);
      const b = frac > 0.02 && i0 + 1 < FRAMES ? images[i0 + 1] : null;
      if (b && b !== a) {
        ctx.globalAlpha = frac;
        paint(b);
        ctx.globalAlpha = 1;
      }
    };

    // Follow the scroll, and settle gently (~0.28 s) when it stops.
    let shown = still ? FRAMES - 1 : progress.get() * (FRAMES - 1);
    let raf = 0;
    let last = performance.now();
    let visible = false;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!visible) return;
      const goal = still ? FRAMES - 1 : progress.get() * (FRAMES - 1);
      if (Math.abs(goal - shown) > 0.001) {
        shown += (goal - shown) * (1 - Math.exp(-dt / 0.28));
        if (Math.abs(goal - shown) < 0.004) shown = goal;
        dirty = true;
      }
      if (dirty) {
        dirty = false;
        draw(shown);
      }
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) load();
        visible = e.isIntersecting;
        if (visible) dirty = true;
      },
      { rootMargin: "150% 0px" }
    );
    io.observe(frame);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [progress, full, still]);

  return (
    <div ref={frameRef} className="absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
    </div>
  );
}

const points = [
  { icon: Leaf, k: "Whole-herb preservation", v: "Herbs kept whole, never powdered." },
  { icon: Sprout, k: "Geo-authentic", v: "Each herb from where it grows best." },
  { icon: Droplets, k: "Easy to prepare", v: "100% natural, potent, ready to steep." },
];

function HerbWords({ compact = false }: { compact?: boolean }) {
  const blends = featuredArcaneHerbTeas.slice(0, 4);
  return (
    <div className={compact ? "" : "max-w-md"}>
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#8a6a35] dark:text-[#d6b679]">
        Another venture from AirGuard Health
        <span aria-hidden="true" className="h-px w-10 bg-current opacity-60" />
      </p>
      <h2 id="arcane-herbs-title" className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-[#2b2620] md:text-5xl dark:text-white">
        Arcane Herbs
      </h2>
      <p className="mt-2 text-sm uppercase tracking-[0.22em] text-[#2b2620]/60 dark:text-white/55">Chinese Classical Formulas</p>
      <p className="mt-5 text-base leading-[1.75] text-[#2b2620]/75 dark:text-white/70">
        Small-batch botanical blends, thoughtfully sourced. Every numbered blend arrives as seven resealable
        sachets, ready to steep. Pure herbs, pure healing.
      </p>
      <ul className={`mt-6 space-y-3 ${compact ? "" : "[@media(max-height:640px)]:hidden"}`}>
        {points.map(({ icon: Icon, k, v }) => (
          <li key={k} className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#b08a3e]/12 text-[#8a6a35] dark:bg-[#d6b679]/15 dark:text-[#d6b679]">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm leading-snug">
              <span className="block font-semibold text-[#2b2620] dark:text-white">{k}</span>
              <span className="text-[#2b2620]/65 dark:text-white/60">{v}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className={`mt-7 flex items-end gap-3 ${compact ? "" : "[@media(max-height:780px)]:hidden"}`}>
        {blends.map((t) => (
          <figure key={t.code} className="w-[22%] max-w-[92px] text-center">
            <div className="aspect-square overflow-hidden rounded-xl bg-white/80 shadow-[0_10px_24px_-16px_rgba(43,38,32,0.6)] dark:bg-white/90">
              <Image src={t.image} alt={`${t.code} ${t.name} herbal tea pack`} sizes="92px" className="size-full object-contain" />
            </div>
            <figcaption className="mt-1.5 text-[10px] font-medium tracking-[0.12em] text-[#2b2620]/60 dark:text-white/55">{t.code}</figcaption>
          </figure>
        ))}
      </div>
      <a
        href="#contact"
        className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#2b2620] px-5 py-2.5 text-sm font-medium text-[#f4efe6] transition-colors hover:bg-[#8a6a35] dark:bg-[#d6b679] dark:text-[#1c1a17] dark:hover:bg-white"
      >
        Ask about our {arcaneHerbTeas.length} blends
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </a>
    </div>
  );
}

export function ArcaneHerbs() {
  const reduceMotion = useReducedMotion();
  const portrait = useMedia(PORTRAIT_QUERY);
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const progress = useTransform(scrollYProgress, [0, PLAY], [0, 1], { clamp: true });

  const rise = (delay = 0) =>
    reduceMotion
      ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.4, delay } }
      : {
          initial: { opacity: 0, y: 28 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  return (
    <Section
      id="arcane-herbs"
      theme="light"
      aria-labelledby="arcane-herbs-title"
      className="relative z-30 overflow-x-clip bg-[#ebe6dc] p-0 md:p-0 lg:p-0 dark:bg-[#1c1a17]"
    >
      {/* The film's words, for screen readers (the film carries them on screen) */}
      <div className="sr-only">
        <p>Arcane Herbs: Traditional Chinese Medicine. Whole-herb preservation, geo-authenticity.</p>
        <p>Pure herbs, pure healing. 100% natural, potent and convenient, easy to prepare.</p>
      </div>

      <div ref={trackRef} className={reduceMotion ? "relative h-[100svh]" : "relative h-[320svh]"}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {portrait ? (
            <HerbFilm progress={progress} full still={reduceMotion} />
          ) : (
            <div className="mx-auto grid h-full w-full max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-[4vw] px-5 md:px-10 lg:pr-24">
              <motion.div {...rise(0)} viewport={{ once: true, amount: 0.4 }} className="pt-[72px]">
                <HerbWords />
              </motion.div>
              {/* the whole film, in a column shaped like it */}
              <div className="relative mt-[72px] aspect-[9/16] h-[calc(100svh-72px)] overflow-hidden">
                <HerbFilm progress={progress} full={false} still={reduceMotion} />
              </div>
            </div>
          )}
        </div>
      </div>

      {portrait && (
        <motion.div {...rise(0)} viewport={{ once: true, amount: 0.3 }} className="relative mx-auto max-w-xl px-5 pb-20 pt-10">
          <HerbWords compact />
        </motion.div>
      )}
    </Section>
  );
}
