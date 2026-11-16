"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ModelSkeleton } from "@/components/three/model-skeleton";
import Link from "next/link";
import { Hand, MessageSquareText, Minus, MousePointer2, Plus } from "lucide-react";
import { Section } from "@/components/layout/section";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";

/*
 * King Hydrogen Aurora up close, the first wellness section after AirGuard XP, built like it: the
 * interactive 3D model with no control panel, every part labelled (dot, leader line, name), drag
 * to turn (it turns slowly by itself), hover a part to light up its label and read what it does.
 * Light in light mode (like the AirGuard XP section); dark mode sets it in a misty studio like the
 * Aurora's product film. A plain section: its content fades up.
 *
 * Four editions share the Aurora's cabinet, so one scene shows them all (aurora-scene.ts
 * `edition`), each finished and lit as its product photo. King Guard has no product photo yet,
 * so it isn't modelled.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

/** Part names and one-liners, in the scene's label order (aurora-scene.ts). */
const PARTS = [
  { id: "jar", name: "Etched glass jar", line: "Threaded glass, lit blue from above." },
  { id: "spigot", name: "Brass spigot", line: "Lever valve and aerated pour spout." },
  { id: "dial", name: "Rotary dial", line: "M, Timer and S settings, Bluetooth®." },
  { id: "buttons", name: "Power & Start/Stop", line: "Green power switch, brushed-steel start." },
  { id: "vents", name: "Cooling louvers", line: "Thirteen slotted front vents." },
  { id: "fan", name: "Exhaust fan", line: "Chrome six-ring grille on top." },
  { id: "door", name: "Crest cabinet door", line: "Crowned H and “Don’t Get Watered Down”." },
  { id: "handle", name: "Side handle", line: "Recessed flush pull." },
];

type EditionId = "aurora" | "founder" | "monarch" | "simplestill";

/** The editions: names and notes as in the products menu; the rest describes each product photo. */
const EDITIONS: {
  id: EditionId;
  /** Name in the products menu and the contact form. */
  name: string;
  short: string;
  note: string;
  copy: string;
  /** Parts this edition doesn't have (no label for them). */
  hidden: string[];
  rename?: Record<string, { name: string; line: string }>;
  highlights: { k: string; v: string }[];
}[] = [
  {
    id: "aurora",
    name: "Aurora Edition",
    short: "Aurora",
    note: "Illuminated glass, engraved crest",
    copy: "Matte-black steel, an etched glass jar lit blue from above, a brass spigot and machined controls.",
    hidden: [],
    highlights: [
      { k: "Etched glass jar", v: "Clear water, rising bubbles" },
      { k: "Brass spigot", v: "Pour straight from the unit" },
      { k: "Rotary controls", v: "M, Timer, S and Bluetooth®" },
    ],
  },
  {
    id: "founder",
    name: "Founder Edition",
    short: "Founder",
    note: "The original numbered run",
    copy: "The same matte-black cabinet and crest, with a clear etched jar and a gold spigot.",
    hidden: [],
    rename: { jar: { name: "Etched glass jar", line: "Clear threaded glass." }, spigot: { name: "Gold spigot", line: "Lever valve and pour spout." } },
    highlights: [
      { k: "Etched glass jar", v: "Clear glass, rising bubbles" },
      { k: "Gold spigot", v: "Pour straight from the unit" },
      { k: "Rotary controls", v: "M, Timer, S and Bluetooth®" },
    ],
  },
  {
    id: "monarch",
    name: "The Monarch",
    short: "Monarch",
    note: "Full-spectrum flagship",
    copy: "The bay becomes a column of full-spectrum light behind two honeycomb grilles, under the same controls.",
    hidden: ["jar", "spigot"],
    highlights: [
      { k: "Full-spectrum bay", v: "Bars of colour behind the grilles" },
      { k: "Honeycomb grilles", v: "Two round grilles" },
      { k: "Rotary controls", v: "M, Timer, S and Bluetooth®" },
    ],
  },
  {
    id: "simplestill",
    name: "SimpleStill",
    short: "SimpleStill",
    note: "Practical dental water distillation",
    copy: "A brushed stainless cabinet with a plain door, a simple switch and a jar with a blue screw lid.",
    hidden: ["dial", "buttons"],
    rename: {
      door: { name: "Cabinet door", line: "Plain brushed-steel door." },
      jar: { name: "Lidded jar", line: "Clear jar with a blue screw lid." },
      spigot: { name: "Spigot", line: "White pour spout." },
    },
    highlights: [
      { k: "Stainless cabinet", v: "Brushed steel throughout" },
      { k: "Lidded jar", v: "Blue screw lid, front spout" },
      { k: "Simple switch", v: "One switch on the front" },
    ],
  },
];

export function Aurora3D() {
  const reduceMotion = useReducedMotion();
  const [editionId, setEditionId] = useState<EditionId>("aurora");
  const edition = EDITIONS.find((e) => e.id === editionId)!;
  const parts = PARTS.filter((p) => !edition.hidden.includes(p.id)).map((p) => ({ ...p, ...edition.rename?.[p.id] }));
  const chooseEdition = (id: EditionId) => {
    if (id === editionId) return;
    setReady(false);
    setFailed(false);
    setPicked(null);
    setEditionId(id);
  };
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const viewRef = useRef<{ zoomIn: () => void; zoomOut: () => void; highlight: (id: string | null) => void } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // three.js loads only in the browser, once the section is near.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cleanup: ((() => void) & { zoomIn: () => void; zoomOut: () => void; highlight: (id: string | null) => void }) | undefined;
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || cleanup) return;
        io.disconnect();
        try {
          const { mountAurora } = await import("@/components/three/aurora-scene");
          if (cancelled) return;
          cleanup = mountAurora(stage, {
            getLabel: (id) => labelRefs.current[id] ?? null,
            reducedMotion: reduceMotion,
            onPick: setPicked,
            edition: editionId,
          });
          viewRef.current = cleanup;
          setReady(true);
        } catch (err) {
          console.error("Aurora 3D view failed to load", err);
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
  }, [reduceMotion, editionId]);

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
      id="aurora-3d"
      theme="light"
      aria-labelledby="aurora-3d-title"
      className="relative z-30 overflow-hidden bg-[radial-gradient(90%_70%_at_70%_45%,#ffffff_0%,#eef2f9_55%,#e2e9f5_100%)] py-16 md:py-20 lg:flex lg:min-h-[100svh] lg:items-center lg:py-12 dark:bg-[radial-gradient(70%_60%_at_68%_48%,#1b2333_0%,#0d1119_55%,#06080c_100%)] dark:text-white"
    >
      {/* Dark mode: studio mist and the blue glow the jar throws, as in the product film. Light mode: just the glow. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] bottom-[-10%] hidden h-[60%] w-[60%] rounded-full bg-white/[0.04] blur-3xl dark:block" />
        <div className="absolute right-[-5%] top-[10%] hidden h-[55%] w-[45%] rounded-full bg-white/[0.035] blur-3xl dark:block" />
        <div className="absolute bottom-[12%] right-[18%] h-[30%] w-[35%] rounded-full bg-[#2557f2]/[0.07] blur-3xl dark:bg-[#2557f2]/[0.12]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 md:px-10 [@media(min-width:1024px)_and_(min-aspect-ratio:1/1)]:grid-cols-[minmax(0,0.75fr)_minmax(0,1.5fr)] lg:gap-2 lg:pt-[72px]">
        {/* ── Copy ── */}
        <motion.div {...rise(0)} viewport={{ once: true, amount: 0.4 }} className="relative z-10 max-w-md">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-500 dark:text-[#6f9bff]">
            King Hydrogen, up close
            <span aria-hidden="true" className="h-px w-12 bg-brand-500/60 dark:bg-[#6f9bff]/60" />
          </p>
          <h2 id="aurora-3d-title" className="mt-4 text-4xl font-medium leading-[1.05] tracking-tight text-navy md:text-5xl dark:text-white">
            A closer look at the <span className="font-bold text-brand-500 dark:text-[#6f9bff]">{edition.short}</span>
          </h2>
          <p className="mt-5 text-base leading-[1.75] text-navy/70 dark:text-white/70">
            {edition.copy} Turn it round and find each part.
          </p>

          {/* Editions: one cabinet, four finishes */}
          <div role="tablist" aria-label="King Hydrogen editions" className="-mx-1 mt-6 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {EDITIONS.map((e) => (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={e.id === editionId}
                aria-controls="aurora-stage"
                onClick={() => chooseEdition(e.id)}
                className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors border-navy/15 bg-white/60 text-navy hover:border-brand-500 aria-selected:border-brand-500 aria-selected:bg-brand-500 aria-selected:text-white dark:border-white/15 dark:bg-white/5 dark:text-white/85 dark:aria-selected:border-[#4f86ff] dark:aria-selected:bg-[#2557f2]"
              >
                {e.short}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-navy/55 dark:text-white/55">{edition.name} · {edition.note}</p>
          <dl className="mt-7 divide-y divide-navy/10 border-y border-navy/10 dark:divide-white/10 dark:border-white/10">
            {edition.highlights.map((h) => (
              <div key={h.k} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-sm font-semibold text-navy dark:text-white">{h.k}</dt>
                <dd className="text-right text-sm text-navy/60 dark:text-white/60">{h.v}</dd>
              </div>
            ))}
          </dl>
          <Link
            href={`/contact?product=king-hydrogen&type=${encodeURIComponent(edition.name)}`}
            data-cta="primary"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-sm font-medium text-white shadow-[0_14px_30px_-14px_rgba(64,103,177,0.8)] hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 max-sm:w-full dark:bg-[#2557f2]"
          >
            <MessageSquareText className="size-4" aria-hidden="true" />
            Enquire about the {edition.short}
          </Link>
        </motion.div>

        {/* ── The model, with every part labelled ── */}
        <motion.div
          {...rise(0.12)}
          viewport={{ once: true, amount: 0.25 }}
          className="relative h-[min(62svh,110vw)] min-h-[340px] sm:h-[62svh] sm:min-h-[380px] lg:h-[min(80svh,780px)]"
        >
          <div
            ref={stageRef}
            id="aurora-stage"
            role="img"
            aria-label={`Interactive 3D model of the King Hydrogen ${edition.name}, labelled: ${parts.map((p) => p.name.toLowerCase()).join(", ")}. Drag to turn it. Illustrative model.`}
            className="absolute inset-0"
          />

          {/* Part labels: positioned every frame by the scene (CSS variables), hidden until it runs */}
          <div aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
            {parts.map((p, i) => (
              <div
                key={p.id}
                ref={(el) => {
                  labelRefs.current[p.id] = el;
                }}
                className="group/label absolute left-0 top-0 transition-opacity duration-300 data-[hidden=1]:opacity-30"
              >
                {/* dot on the part */}
                <span className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 ring-[3px] ring-white shadow-[0_0_0_6px_rgba(64,103,177,0.18)] dark:bg-[#4f86ff] dark:ring-[#0d1119] dark:shadow-[0_0_0_6px_rgba(79,134,255,0.25)] [left:var(--ax)] [top:var(--ay)] group-data-[active=1]/label:scale-125 max-sm:grid max-sm:size-5 max-sm:place-items-center max-sm:text-[10px] max-sm:font-bold max-sm:leading-none max-sm:text-white">
                  <span className="sm:hidden">{i + 1}</span>
                </span>
                {/* leader line */}
                <span className="absolute h-px origin-left max-sm:hidden max-sm:group-data-[active=1]/label:block bg-brand-500/70 dark:bg-[#6f9bff]/70 [left:var(--ax)] [top:var(--ay)] [width:var(--len)] [rotate:var(--ang)]" />
                {/* name pill, on the outer side of the line's end */}
                <span className="absolute -translate-y-1/2 max-sm:hidden max-sm:group-data-[active=1]/label:block [left:var(--px,var(--ex))] [top:var(--py,var(--ey))] group-data-[side=left]/label:-translate-x-full">
                  <span className="mx-1.5 block w-max max-w-[300px] rounded-xl border border-white/80 bg-white/90 px-3 py-1.5 shadow-[0_10px_24px_-14px_rgba(23,34,54,0.55)] backdrop-blur-md transition-colors group-data-[active=1]/label:border-brand-500 group-data-[active=1]/label:bg-brand-500 dark:border-white/15 dark:bg-[#121826]/85 dark:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.8)] dark:group-data-[active=1]/label:border-[#4f86ff] dark:group-data-[active=1]/label:bg-[#2557f2]">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy group-data-[active=1]/label:text-white dark:text-white">{p.name}</span>
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

          {/* Zoom in / out */}
          {ready && (
            <div className="absolute right-2 top-2 z-10 flex flex-col overflow-hidden rounded-full border backdrop-blur-md lg:right-16 2xl:right-2 border-white/80 bg-white/70 text-navy/70 dark:border-white/15 dark:bg-white/5 dark:text-white/80">
              <button
                type="button"
                onClick={() => viewRef.current?.zoomIn()}
                aria-label="Zoom in"
                title="Zoom in"
                className="grid size-10 place-items-center transition-colors text-navy/70 hover:bg-white hover:text-navy dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-500"
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
              <span aria-hidden="true" className="mx-auto h-px w-5 bg-navy/15 dark:bg-white/15" />
              <button
                type="button"
                onClick={() => viewRef.current?.zoomOut()}
                aria-label="Zoom out"
                title="Zoom out"
                className="grid size-10 place-items-center transition-colors text-navy/70 hover:bg-white hover:text-navy dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-500"
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* How to interact */}
          {ready && (
            <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
              <p className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs text-navy/70 backdrop-blur-md dark:border-white/15 dark:bg-white/5 dark:text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <Hand className="size-3.5" aria-hidden="true" /> Drag to turn
                </span>
                <span aria-hidden="true" className="h-3 w-px bg-navy/20 dark:bg-white/20" />
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
          {parts.map((p, i) => (
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
                className="flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[12px] font-medium leading-tight transition-colors border-navy/10 bg-white/70 text-navy data-[on=1]:border-brand-500 data-[on=1]:bg-brand-500 data-[on=1]:text-white dark:border-white/15 dark:bg-white/5 dark:text-white/85 dark:data-[on=1]:border-[#4f86ff] dark:data-[on=1]:bg-[#2557f2]"
              >
                <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold bg-brand-500 text-white dark:bg-[#2557f2]">{i + 1}</span>
                {p.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
