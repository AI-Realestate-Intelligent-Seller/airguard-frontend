"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ModelSkeleton } from "@/components/three/model-skeleton";
import Link from "next/link";
import { ArrowRight, Hand, MessageSquareText, Minus, MousePointer2, Plus } from "lucide-react";
import { Section } from "@/components/layout/section";
import { AddToCart } from "@/components/cart/add-to-cart";
import { techTabs } from "@/data/airguard-technology";
import { useIsDark } from "@/hooks/use-is-dark";
import { setXpLight } from "@/lib/xp-light";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { EASE } from "@/lib/motion";

/*
 * AirGuard XP up close: the interactive 3D model, with no control panel. Every part carries a
 * label pinned to it (a dot on the part, a leader line, the part's name); the scene moves them as
 * the model turns and dims any that go behind it. Visitors drag to turn the model (it turns slowly
 * by itself) and hover a part to highlight its label and read what it does.
 * A plain section: it scrolls in after Our World and its content fades up.
 */

/** Part names and one-liners, in the scene's part order (airguard-xp-scene.ts). */
const PARTS = [
  { id: "shield", name: "Aerosol barrier", line: "A clear working boundary." },
  { id: "suction", name: "Extra-oral suction", line: "Fits hoses 3–6 in across." },
  { id: "lighting", name: "Under-glass LEDs", line: "Light across the working area." },
  { id: "precision", name: "Precision lighting", line: "Four corner spotlights." },
  { id: "magnification", name: "Display & magnification", line: "A movable, closer view." },
  { id: "camera", name: "HD camera", line: "Sits just behind the display." },
  { id: "handle", name: "Handle & adjustment", line: "Position the guard comfortably." },
  { id: "buttons", name: "Physical buttons", line: "Two front control banks." },
];

/** The four LED colours, from airguardhealth.com/technology (the lighting tab's swatches). */
const LEDS = techTabs.find((t) => t.id === "lighting")?.swatches ?? [];
/** "Get a quote" opens the contact form with the XP already chosen. */
export const XP_QUOTE_HREF = `/contact?product=airguard&type=${encodeURIComponent("AirGuard XP")}`;

type SceneApi = {
  zoomIn: () => void;
  zoomOut: () => void;
  highlight: (id: string | null) => void;
};

const highlights = [
  { k: "Clear barrier", v: "Shield above the treatment area" },
  { k: "Extra-oral suction", v: "Fits your existing vacuum" },
  { k: "Under-glass LEDs", v: "Light across the working area" },
];

export function AirGuard3D() {
  const reduceMotion = useReducedMotion();
  // Same studio as the XP detail page: light, or blue rim lights on a dark stage in dark mode.
  const dark = useIsDark();
  // The lights cycle through the four LED colours on their own; this names the one showing.
  const [led, setLed] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const viewRef = useRef<SceneApi | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // three.js loads only in the browser, once the section is near.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cleanup: ((() => void) & SceneApi) | undefined;
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || cleanup) return;
        io.disconnect();
        try {
          const { mountAirGuard } = await import("@/components/three/airguard-xp-scene");
          if (cancelled) return;
          cleanup = mountAirGuard(stage, {
            getLabel: (id) => labelRefs.current[id] ?? null,
            reducedMotion: reduceMotion,
            onPick: setPicked,
            numberedDots: true,
            theme: dark ? "dark" : "light",
            showLights: true,
            lightCycle: LEDS.map((l) => l.hex),
            onLightChange: (i: number) => {
              setLed(i);
              if (LEDS[i]) setXpLight(LEDS[i].hex);
            },
          });
          viewRef.current = cleanup;

          setReady(true);
        } catch (err) {
          console.error("AirGuard 3D view failed to load", err);
          setFailed(true);
        }
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(stage);
    return () => {
      cancelled = true;
      io.disconnect();
      viewRef.current = null;
      cleanup?.();
    };
  }, [reduceMotion, dark]);


  const rise = (delay = 0) =>
    reduceMotion
      ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.4, delay } }
      : {
          initial: { opacity: 0, y: 32 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <Section
      id="airguard-3d"
      theme="light"
      aria-labelledby="airguard-3d-title"
      className="relative z-30 overflow-hidden bg-[radial-gradient(90%_70%_at_70%_45%,#ffffff_0%,#eef2f9_55%,#e2e9f5_100%)] py-16 md:py-20 lg:flex lg:min-h-[100svh] lg:items-center lg:py-12 dark:bg-[radial-gradient(90%_70%_at_70%_45%,#1a2a4a_0%,#0f1a30_60%,#0a1222_100%)]"
    >
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 md:px-10 [@media(min-width:1024px)_and_(min-aspect-ratio:1/1)]:grid-cols-[minmax(0,0.75fr)_minmax(0,1.5fr)] lg:gap-2 lg:pt-[72px]">
        {/* ── Copy ── */}
        <motion.div {...rise(0)} viewport={{ once: true, amount: 0.4 }} className="relative z-10 max-w-md">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
            The product, up close
            <span aria-hidden="true" className="h-px w-12 bg-brand-500/60" />
          </p>
          <h2 id="airguard-3d-title" className="mt-4 text-4xl font-medium leading-[1.05] tracking-tight text-navy md:text-5xl">
            A closer look at <span className="font-bold text-brand-500">AirGuard XP</span>
          </h2>
          <p className="mt-5 text-base leading-[1.75] text-navy/70">
            A clear shield, under-glass lighting, a hinged display and extra-oral suction in one chairside unit. Turn it
            round and find each part.
          </p>
          <dl className="mt-7 divide-y divide-navy/10 border-y border-navy/10">
            {highlights.map((h) => (
              <div key={h.k} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-sm font-semibold text-navy">{h.k}</dt>
                <dd className="text-right text-sm text-navy/60">{h.v}</dd>
              </div>
            ))}
          </dl>
          {/* Ways in: buy, ask, or read the full page. Two equal buttons on phones, thumb-sized. */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <AddToCart id="xp" className="w-full sm:w-auto" />
            <Link
              href={XP_QUOTE_HREF}
              data-cta=""
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-navy/15 bg-white/70 px-5 text-sm font-medium text-navy backdrop-blur-sm transition-colors hover:border-brand-500 hover:text-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 dark:border-white/15 dark:bg-white/5 dark:text-white"
            >
              <MessageSquareText className="size-4" aria-hidden="true" />
              Get a quote
            </Link>
            <Link
              href="/products/xp"
              className="group col-span-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 sm:col-span-1 sm:ml-1 dark:text-brand-300"
            >
              See XP details
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        {/* ── The model, with every part labelled ── */}
        <motion.div
          {...rise(0.12)}
          viewport={{ once: true, amount: 0.25 }}
          className="relative h-[min(62svh,110vw)] min-h-[340px] sm:h-[62svh] sm:min-h-[380px] lg:h-[min(80svh,780px)]"
        >
          <div
            ref={stageRef}
            role="img"
            aria-label="Interactive 3D model of AirGuard XP, labelled: aerosol barrier, extra-oral suction, under-glass LEDs, precision lighting, display and magnification, HD camera, handle and adjustment, physical buttons. Drag to turn it."
            className="absolute inset-0"
          />

          {/* Part labels: positioned every frame by the scene (CSS variables), hidden until it runs */}
          <div aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
            {PARTS.map((p, i) => (
              <div
                key={p.id}
                ref={(el) => {
                  labelRefs.current[p.id] = el;
                }}
                className="part-label group/label absolute left-0 top-0 transition-opacity duration-300 data-[hidden=1]:opacity-30"
              >
                {/* dot on the part */}
                <span className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 ring-[3px] ring-white shadow-[0_0_0_6px_rgba(64,103,177,0.18)] [left:var(--ax)] [top:var(--ay)] group-data-[active=1]/label:scale-125 max-sm:grid max-sm:size-5 max-sm:place-items-center max-sm:text-[10px] max-sm:font-bold max-sm:leading-none max-sm:text-white">
                  <span className="sm:hidden">{i + 1}</span>
                </span>
                {/* leader line */}
                <span className="absolute h-px origin-left max-sm:hidden max-sm:group-data-[active=1]/label:block bg-brand-500/70 [left:var(--ax)] [top:var(--ay)] [width:var(--len)] [rotate:var(--ang)]" />
                {/* name pill, on the outer side of the line's end */}
                <span className="absolute -translate-y-1/2 max-sm:hidden max-sm:group-data-[active=1]/label:block [left:var(--px,var(--ex))] [top:var(--py,var(--ey))] group-data-[side=left]/label:-translate-x-full">
                  <span className="mx-1.5 block w-max max-w-[300px] rounded-xl border border-white/80 bg-white/90 px-3 py-1.5 shadow-[0_10px_24px_-14px_rgba(23,34,54,0.55)] backdrop-blur-md transition-colors group-data-[active=1]/label:border-brand-500 group-data-[active=1]/label:bg-brand-500 dark:border-white/10 dark:bg-[#16223a]/90">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy group-data-[active=1]/label:text-white">
                      {p.name}
                    </span>
                    <span className="hidden text-xs leading-snug text-white/85 group-data-[active=1]/label:block">{p.line}</span>
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Loading skeleton / fallback */}
          <AnimatePresence>
            {!ready && (
              <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
                <ModelSkeleton failed={failed} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* LED colour now showing (the model cycles through all four on its own) */}
          {ready && LEDS[led] && (
            <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-2.5 rounded-full border border-white/80 bg-white/70 py-2 pl-2.5 pr-3.5 backdrop-blur-md dark:border-white/15 dark:bg-white/5">
              <span
                aria-hidden="true"
                className="size-3 rounded-full ring-1 ring-navy/15 transition-[background-color,box-shadow] duration-700 dark:ring-white/25"
                style={{ background: LEDS[led].hex, boxShadow: `0 0 10px 1px ${LEDS[led].hex}` }}
              />
              <span className="text-[11px] font-medium text-navy/75 dark:text-white/80">
                {LEDS[led].name} <span className="text-navy/45 dark:text-white/50">· {LEDS[led].value}</span>
              </span>
            </div>
          )}

          {/* Zoom in / out */}
          {ready && (
            <div className="absolute right-2 top-2 z-10 flex flex-col overflow-hidden rounded-full border backdrop-blur-md lg:right-16 2xl:right-2 border-white/80 bg-white/70 text-navy/70">
              <button
                type="button"
                onClick={() => viewRef.current?.zoomIn()}
                aria-label="Zoom in"
                title="Zoom in"
                className="grid size-10 place-items-center transition-colors text-navy/70 hover:bg-white hover:text-navy dark:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-500"
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
              <span aria-hidden="true" className="mx-auto h-px w-5 bg-navy/15 dark:bg-white/15" />
              <button
                type="button"
                onClick={() => viewRef.current?.zoomOut()}
                aria-label="Zoom out"
                title="Zoom out"
                className="grid size-10 place-items-center transition-colors text-navy/70 hover:bg-white hover:text-navy dark:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-500"
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* How to interact */}
          {ready && (
            <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
              <p className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs text-navy/70 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <span className="inline-flex items-center gap-1.5">
                  <Hand className="size-3.5" aria-hidden="true" /> Drag to turn
                </span>
                <span aria-hidden="true" className="h-3 w-px bg-navy/20" />
                <span className="inline-flex items-center gap-1.5">
                  <MousePointer2 className="size-3.5" aria-hidden="true" /> <span className="sm:hidden">Tap a part</span><span className="max-sm:hidden">Hover a part</span>
                </span>
                <span aria-hidden="true" className="h-3 w-px bg-navy/15 dark:bg-white/15" />
                <span><span className="max-sm:hidden">+ / − or </span>pinch to zoom</span>
              </p>
            </div>
          )}
        </motion.div>

        {/* Phones: the parts by number; tap one to light it on the model */}
        <ol aria-label="Parts" className="grid grid-cols-2 gap-2 sm:hidden">
          {PARTS.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                data-on={picked === p.id ? 1 : 0}
                aria-pressed={picked === p.id}
                onClick={() => {
                  const next = picked === p.id ? null : p.id;
                  setPicked(next);
                  viewRef.current?.highlight(next);
                }}
                className="flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[12px] font-medium leading-tight transition-colors border-navy/10 bg-white/70 text-navy data-[on=1]:border-brand-500 data-[on=1]:bg-brand-500 data-[on=1]:text-white dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold bg-brand-500 text-white">{i + 1}</span>
                {p.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/** /products part names and lines, from airguardhealth.com (XP page and /technology). */
const STAGE_PARTS = [
  { id: "shield", name: "Barrier", line: "Designed to sit 12” above the patient." },
  { id: "suction", name: "Extra-oral suction", line: "Move contaminated air away from you and the patient." },
  { id: "lighting", name: "LED side strips", line: "Multi-colored integrated lighting." },
  { id: "precision", name: "Precision lighting", line: "Four corner spotlights." },
  { id: "magnification", name: "Magnification", line: "Intra-oral and extra-oral magnification." },
  { id: "camera", name: "HD camera", line: "Intra- and extra-oral photos in one simple step." },
  { id: "handle", name: "Ergonomic handle", line: "Raise, lower or angle the guard." },
  { id: "buttons", name: "Capacitive buttons", line: "Intuitive and easy to clean." },
];

/**
 * The interactive 3D model with its pinned part labels, loader and interaction hint. Fills its
 * positioned parent. Used by /products (the home page has its own stage above, with zoom and a parts list); three.js loads only once it's near.
 */
export function AirGuardStage({ variant = "xp" }: { variant?: "xp" | "mp" }) {
  const reduceMotion = useReducedMotion();
  // MP has no display or camera, so those labels go too.
  const parts = variant === "mp" ? STAGE_PARTS.filter((p) => p.id !== "magnification" && p.id !== "camera") : STAGE_PARTS;
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // three.js loads only in the browser, once the section is near.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || cleanup) return;
        io.disconnect();
        try {
          const { mountAirGuard } = await import("@/components/three/airguard-xp-scene");
          if (cancelled) return;
          cleanup = mountAirGuard(stage, {
            getLabel: (id) => labelRefs.current[id] ?? null,
            reducedMotion: reduceMotion,
            variant,
          });
          setReady(true);
        } catch (err) {
          console.error("AirGuard 3D view failed to load", err);
          setFailed(true);
        }
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(stage);
    return () => {
      cancelled = true;
      io.disconnect();
      cleanup?.();
    };
  }, [reduceMotion, variant]);

  return (
    <>
      <div
        ref={stageRef}
        role="img"
        aria-label={`Interactive 3D model of AirGuard ${variant.toUpperCase()}, labelled: ${parts.map((p) => p.name.toLowerCase()).join(", ")}. Drag to turn it.`}
        className="absolute inset-0"
      />

      {/* Part labels: positioned every frame by the scene (CSS variables), hidden until it runs */}
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
        {parts.map((p) => (
          <div
            key={p.id}
            ref={(el) => {
              labelRefs.current[p.id] = el;
            }}
            className="part-label group/label absolute left-0 top-0 transition-opacity duration-300 data-[hidden=1]:opacity-30"
          >
            {/* dot on the part */}
            <span className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 ring-[3px] ring-white shadow-[0_0_0_6px_rgba(64,103,177,0.18)] [left:var(--ax)] [top:var(--ay)] group-data-[active=1]/label:scale-125" />
            {/* leader line */}
            <span className="absolute h-px origin-left bg-brand-500/70 [left:var(--ax)] [top:var(--ay)] [width:var(--len)] [rotate:var(--ang)]" />
            {/* name pill, on the outer side of the line's end */}
            <span className="absolute -translate-y-1/2 [left:var(--ex)] [top:var(--ey)] group-data-[side=left]/label:-translate-x-full">
              <span className="mx-1.5 block w-max max-w-[300px] rounded-xl border border-white/80 bg-white/90 px-3 py-1.5 shadow-[0_10px_24px_-14px_rgba(23,34,54,0.55)] backdrop-blur-md transition-colors group-data-[active=1]/label:border-brand-500 group-data-[active=1]/label:bg-brand-500 dark:border-white/10 dark:bg-[#16223a]/90">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy group-data-[active=1]/label:text-white">
                  {p.name}
                </span>
                <span className="hidden text-xs leading-snug text-white/85 group-data-[active=1]/label:block">{p.line}</span>
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Loading / fallback */}
      <AnimatePresence>
        {!ready && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
            <ModelSkeleton failed={failed} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* How to interact */}
      {ready && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
          <p className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs text-navy/70 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            <span className="inline-flex items-center gap-1.5">
              <Hand className="size-3.5" aria-hidden="true" /> Drag to turn
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-navy/20" />
            <span className="inline-flex items-center gap-1.5">
              <MousePointer2 className="size-3.5" aria-hidden="true" /> Hover a part
            </span>
          </p>
        </div>
      )}
    </>
  );
}
