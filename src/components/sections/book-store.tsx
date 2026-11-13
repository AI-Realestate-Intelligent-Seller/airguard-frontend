"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowUpRight, Headphones } from "lucide-react";
import { Section } from "@/components/layout/section";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { BOOK_STORE_URL, storeBooks } from "@/data/book-store";

/*
 * The Book Store, straight after the Aurora. Two parts:
 *  1. The Throne and Liberty, played by the scroll. Not a video player: the film's frames are drawn
 *     edge to edge as part of the section while it holds the screen. Scrolling moves it forward,
 *     scrolling back rewinds, and when the scroll stops it eases to rest (neighbouring frames are
 *     blended, so it never stutters). The book rises from its pedestal through a splash of water,
 *     then settles beside "Water is power. But not the kind you think." Light film in light mode, dark film in dark mode; upright screens (phones) get the
 *     portrait cut of each.
 *  2. The shelf: every title in the store with its price, each linking to its store page.
 */
const EASE = [0.16, 1, 0.3, 1] as const;
/** Share of the pinned scroll that plays the film; the rest holds its last frame. */
const PLAY = 0.82;
const FRAMES = 240;
/** Two cuts of the film: landscape (1280×720) for wide screens, portrait (720×1280) for upright ones. */
const frameUrl = (theme: "light" | "dark", portrait: boolean, i: number) =>
  `/frames/the-throne-and-liberty/${theme}${portrait ? "-portrait" : ""}/${String(i + 1).padStart(3, "0")}.webp`;
/** The films' own backdrop at their edges, so the section and the film meet without a seam. */
const EDGE = { light: "#deddd4", dark: "#1a1c1d" };
/** The portrait cut's top edge (shows behind the site bar on upright screens). */
const EDGE_TOP = { light: "#dcddd6", dark: "#161a1d" };
/** Upright screens (phones, tablets held upright) get the portrait cut. */
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

/** Follows the site's light / dark switch (the `dark` class on <html>). */
function useSiteDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

const price = (n: number) => `$${n.toFixed(2)}`;

/**
 * Draws the film's frame for the scroll position onto a canvas that fills the pinned frame edge to
 * edge on every screen (no margins). Where the screen is narrower than the film, the view follows
 * the subject: centred on the rising book, settling on it in the final shot, then, during the hold
 * (`hold` 0 → 1), panning across to the film's words. The picture's box is published as CSS
 * variables (--fx, --fy, --fw, --fh) for anything placed over the film.
 */
function ScrollFilm({
  progress,
  hold,
  theme,
  portrait,
  still,
}: {
  progress: MotionValue<number>;
  hold: MotionValue<number>;
  theme: "light" | "dark";
  portrait: boolean;
  still: boolean;
}) {
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

    // Load coarse-to-fine (every 16th frame, then every 8th…), a few at a time, so the whole film
    // is scrubbable early and fills in detail as it arrives. The last frame comes first: it's the rest pose.
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
        img.src = frameUrl(theme, portrait, i);
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

    // Ease toward the frame the scroll asks for: quick while scrolling, a soft glide to rest after.
    let shown = still ? FRAMES - 1 : progress.get() * (FRAMES - 1);
    let shownHold = still ? 1 : hold.get();
    let dirty = true;

    // Size the canvas to the frame.
    let W = 0, H = 0, dpr = 1;
    const box = { x: 0, y: 0, w: 0, h: 0 };
    /** Where to look across the film (0 = left edge, 1 = right), for a frame and the hold. */
    const focusX = (pos: number, h: number) => {
      const settle = Math.min(1, Math.max(0, (pos - 130) / 90)); // the book moves left into its final place
      const book = 0.5 + (0.335 - 0.5) * settle * settle * (3 - 2 * settle);
      const pan = h * h * (3 - 2 * h);
      return book + (0.7 - book) * pan; // then across to the words
    };
    const place = (pos: number, h: number) => {
      if (portrait) {
        // Portrait cut: fill the screen below the site bar (all of its words stay in view), sitting
        // on the bottom edge; the strip above is the film's own top edge, carried up (see paint).
        const s = Math.max(W / 720, (H - 72) / 1280);
        box.w = 720 * s; box.h = 1280 * s;
        box.x = (W - box.w) / 2;
        box.y = H - box.h;
        return;
      }
      // cover: the film always fills the frame
      const s = Math.max(W / 1280, H / 720);
      box.w = 1280 * s; box.h = 720 * s;
      box.y = (H - box.h) / 2;
      // Wide screens see nearly the whole film: keep it centred. Narrower ones follow the subject.
      const want = W / box.w > 0.72 ? (W - box.w) / 2 : W / 2 - focusX(pos, h) * box.w;
      box.x = Math.min(0, Math.max(W - box.w, want));
    };
    const publish = () => {
      frame.style.setProperty("--fx", `${box.x}px`);
      frame.style.setProperty("--fy", `${box.y}px`);
      frame.style.setProperty("--fw", `${box.w}px`);
      frame.style.setProperty("--fh", `${box.h}px`);
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = frame.clientWidth;
      H = frame.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      place(shown, still ? 1 : hold.get());
      publish();
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    resize();

    const draw = (pos: number) => {
      const i0 = Math.max(0, Math.min(FRAMES - 1, Math.floor(pos)));
      const frac = pos - i0;
      const a = nearest(i0, -1) || nearest(i0, 1);
      if (!a) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = portrait ? EDGE_TOP[theme] : EDGE[theme];
      ctx.fillRect(0, 0, W, H);
      const paint = (img: HTMLImageElement) => {
        ctx.drawImage(img, box.x, box.y, box.w, box.h);
        // Portrait cut sits below the site bar: carry its top edge up to the top of the screen, so
        // the film runs on from the section above with no band between them.
        if (box.y > 0.5) ctx.drawImage(img, 0, 0, img.naturalWidth, 18, box.x, 0, box.w, box.y + 1);
      };
      paint(a);
      // Blend toward the next frame for motion between frames.
      const b = frac > 0.02 && i0 + 1 < FRAMES ? images[i0 + 1] : null;
      if (b && b !== a) {
        ctx.globalAlpha = frac;
        paint(b);
        ctx.globalAlpha = 1;
      }
    };

    let raf = 0;
    let last = performance.now();
    let visible = false;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!visible) return;
      const goal = still ? FRAMES - 1 : progress.get() * (FRAMES - 1);
      const goalHold = still ? 1 : hold.get();
      const k = 1 - Math.exp(-dt / 0.28); // time constant ~0.28 s: follows the scroll, settles gently when it stops
      if (Math.abs(goal - shown) > 0.001 || Math.abs(goalHold - shownHold) > 0.0005) {
        shown += (goal - shown) * k;
        shownHold += (goalHold - shownHold) * k;
        if (Math.abs(goal - shown) < 0.004) shown = goal;
        if (Math.abs(goalHold - shownHold) < 0.001) shownHold = goalHold;
        dirty = true;
      }
      if (dirty) {
        dirty = false;
        place(shown, shownHold);
        publish();
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
  }, [progress, hold, theme, portrait, still]);

  return (
    <div ref={frameRef} className="absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
    </div>
  );
}

export function BookStore() {
  const reduceMotion = useReducedMotion();
  const dark = useSiteDark();
  const theme = dark ? "dark" : "light";
  const portrait = useMedia(PORTRAIT_QUERY);

  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const progress = useTransform(scrollYProgress, [0, PLAY], [0, 1], { clamp: true });
  const hold = useTransform(scrollYProgress, [PLAY, 0.97], [0, 1], { clamp: true });

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
      id="book-store"
      theme="light"
      aria-labelledby="book-store-title"
      // overflow-x-clip: the phone shelf scrolls sideways inside itself, never the page
      className="relative z-30 overflow-x-clip bg-[#deddd4] p-0 md:p-0 lg:p-0 dark:bg-[#1a1c1d]"
    >
      {/* ── 1. The film, played by the scroll (reduced motion: its final frame, still) ── */}
      <div ref={trackRef} className={reduceMotion ? "relative h-[100svh]" : "relative h-[360svh]"}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <ScrollFilm progress={progress} hold={hold} theme={theme} portrait={portrait} still={reduceMotion} />

          {/* The film's words, for screen readers (the film carries them on screen) */}
          <div className="sr-only">
            <p>The Throne and Liberty: Water Is Not What You Believe.</p>
            <p>Water is power. But not the kind you think. This book reveals the ancient and modern control systems hiding in plain sight.</p>
          </div>

          {!reduceMotion && (
            <div className="pointer-events-none absolute inset-x-[30%] bottom-6 h-px bg-navy/15 dark:bg-white/15">
              <motion.div style={{ scaleX: progress }} className="h-full origin-left bg-navy/50 dark:bg-white/60" />
            </div>
          )}

        </div>
      </div>

      {/* ── 2. The shelf ── */}
      <div className="relative mx-auto max-w-[1400px] px-5 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
        <motion.div {...rise(0)} viewport={{ once: true, amount: 0.5 }} className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-[#8fb0ff]">
              Orrington Publishing
              <span aria-hidden="true" className="h-px w-12 bg-current opacity-60" />
            </p>
            <h2 id="book-store-title" className="mt-4 text-4xl font-medium leading-[1.05] tracking-tight text-navy md:text-5xl dark:text-white">
              The <span className="font-bold">Book Store</span>
            </h2>
            <p className="mt-4 text-base leading-[1.75] text-navy/70 dark:text-white/65">
              Books and audiobooks on water, health and living well, in English, Spanish and Chinese.
            </p>
          </div>
          <a
            href={BOOK_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-navy/15 px-5 py-2.5 text-sm font-medium text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white dark:border-white/20 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-navy"
          >
            Visit the full store
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </motion.div>

        <ul className="-mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 md:gap-y-12 md:overflow-visible md:px-0 md:pb-0">
          {storeBooks.map((b, i) => (
            <motion.li
              key={b.id}
              {...rise(0.05 * (i % 4))}
              viewport={{ once: true, amount: 0.3 }}
              className="w-[62%] shrink-0 snap-start sm:w-[40%] md:w-auto"
            >
              <a href={b.href} target="_blank" rel="noopener noreferrer" className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
                <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(80%_70%_at_50%_40%,#fbfaf6_0%,#efeee8_60%,#e5e3db_100%)] p-[12%] dark:bg-[radial-gradient(80%_70%_at_50%_40%,#2a2d30_0%,#222528_60%,#1d2022_100%)]">
                  <Image
                    src={b.cover}
                    alt={`Cover of ${b.title}`}
                    sizes="(min-width: 768px) 22vw, 60vw"
                    className="h-full w-auto max-w-full object-contain drop-shadow-[0_18px_22px_rgba(10,16,22,0.35)] transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:scale-[1.03]"
                  />
                  {i === 0 && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white dark:bg-white dark:text-navy">
                      <Headphones className="size-3" aria-hidden="true" /> New
                    </span>
                  )}
                  {b.was && (
                    <span className="absolute right-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      Sale
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <h3 lang={b.lang} className="text-base font-semibold leading-snug text-navy dark:text-white">
                      {b.title}
                    </h3>
                    {b.note && <p className="mt-0.5 text-sm text-navy/55 dark:text-white/50">{b.note}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-navy sm:text-right dark:text-white">
                    {b.was && (
                      <>
                        <span className="sr-only">Was </span>
                        <s className="mr-1.5 font-normal text-navy/40 dark:text-white/40">{price(b.was)}</s>
                        <span className="sr-only">, now </span>
                      </>
                    )}
                    {price(b.price)}
                  </p>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-[#8fb0ff]">
                  View in store
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </span>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

