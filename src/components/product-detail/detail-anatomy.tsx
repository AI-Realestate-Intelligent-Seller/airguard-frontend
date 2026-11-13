"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ModelStage } from "@/components/product-detail/model-stage";
import { modelById, type ModelId } from "@/data/airguard-models";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
/** Share of the pinned scroll spent pulling the model apart before the first part is shown. */
const INTRO = 0.14;
/** How far apart the model is pulled (1 = each part's full offset). */
const SPREAD = 0.55;

type Steps = (typeof modelById)[ModelId]["anatomy"];

/**
 * Anatomy: the model pulled apart, one component at a time. The scene is pinned while the page
 * scrolls through the parts; each step highlights its part in 3D and shows the documented line.
 * Desktop lists every step beside the model; phones and tablets keep the model on screen with the
 * current step under it and a progress bar. Steps (and parts on the model) jump there when tapped.
 * Reduced motion gets the model already pulled apart with tappable steps instead.
 * Light studio, dark navy in dark mode.
 */
export function DetailAnatomy({ id }: { id: ModelId }) {
  const desktop = useIsDesktop();
  const reduce = useMotionPreference();
  if (reduce) return <StaticAnatomy id={id} />;
  return desktop ? <PinnedAnatomy id={id} /> : <PinnedAnatomyCompact id={id} />;
}

const SECTION = "relative bg-[#f3f6fb] dark:bg-[#0b1322]";
const GLOW = "pointer-events-none absolute inset-0 opacity-50 dark:opacity-100";

function Heading({ name, compact = false }: { name: string; compact?: boolean }) {
  return (
    <>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-brand-600 dark:text-brand-300">{name}</p>
      <h2 id="anatomy-title" className={cn("font-medium tracking-tight text-navy", compact ? "mt-1.5 text-2xl" : "mt-3 text-3xl md:text-4xl")}>
        Components
      </h2>
    </>
  );
}

/**
 * The pinned scroll shared by both layouts: the track's progress pulls the model apart, then picks
 * the active step. `goTo` scrolls to the middle of a step's slice.
 */
function useAnatomyScroll(steps: Steps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const explode = useRef(0);
  const focus = useRef<string | null>(null);
  const [active, setActive] = useState(-1);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    explode.current = SPREAD * Math.min(1, p / INTRO);
    const i = p < INTRO ? -1 : Math.min(steps.length - 1, Math.floor(((p - INTRO) / (1 - INTRO)) * steps.length));
    focus.current = i < 0 ? null : steps[i].part;
    setActive(i);
  });

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    const p = INTRO + ((i + 0.5) / steps.length) * (1 - INTRO);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + travel * p, behavior: "smooth" });
  };
  const onSelect = (part: string) => {
    const i = steps.findIndex((s) => s.part === part);
    if (i >= 0) goTo(i);
  };

  return { trackRef, explode, focus, active, goTo, onSelect };
}

const stageLabel = (name: string, steps: Steps) => `3D model of ${name}, pulled apart into its components: ${steps.map((s) => s.name).join(", ")}.`;

function PinnedAnatomy({ id }: { id: ModelId }) {
  const m = modelById[id];
  const steps = m.anatomy;
  const { trackRef, explode, focus, active, goTo, onSelect } = useAnatomyScroll(steps);

  return (
    <section id="anatomy" aria-labelledby="anatomy-title" className={SECTION}>
      <div ref={trackRef} style={{ height: `${(steps.length + 1.4) * 70}svh` }} className="relative">
        <div className="sticky top-0 grid h-[100svh] grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] items-center gap-6 overflow-hidden px-10 pt-16 xl:px-14">
          <div aria-hidden="true" className={cn(GLOW, "bg-[radial-gradient(50%_55%_at_64%_50%,rgba(64,103,177,0.3),transparent_75%)]")} />

          <div className="relative z-10 max-w-md">
            <Heading name={m.name} />
            <ol className="mt-8 border-b border-navy/10">
              {steps.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.part} className="border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={on ? "step" : undefined}
                      className="group grid w-full grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3.5 text-left"
                    >
                      <span className={cn("text-xs font-medium tabular-nums transition-colors", on ? "text-brand-600 dark:text-brand-300" : "text-navy/35")}>{String(i + 1).padStart(2, "0")}</span>
                      <span>
                        <span className={cn("block text-[15px] font-medium transition-colors", on ? "text-navy" : "text-navy/55 group-hover:text-navy/85")}>{s.name}</span>
                        <motion.span
                          initial={false}
                          animate={{ height: on ? "auto" : 0, opacity: on ? 1 : 0 }}
                          transition={{ duration: 0.45, ease: EASE }}
                          className="block overflow-hidden"
                        >
                          <span className="block pt-1.5 text-sm leading-relaxed text-navy/65">{s.line}</span>
                        </motion.span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-navy/45">Click a part on the model, or a step, to jump to it.</p>
          </div>

          <ModelStage id={id} explode={explode} focus={focus} labels={steps} onSelect={onSelect} label={stageLabel(m.name, steps)} className="relative z-10 h-[78svh]" />
        </div>
      </div>
    </section>
  );
}

/**
 * Phones and tablets: the model pinned under the site bar, the current step's card below it and
 * a segmented progress bar. Vertical swipes scroll the page (the canvas only takes sideways drags),
 * so scrolling steps through the parts just like desktop.
 */
function PinnedAnatomyCompact({ id }: { id: ModelId }) {
  const m = modelById[id];
  const steps = m.anatomy;
  const { trackRef, explode, focus, active, goTo, onSelect } = useAnatomyScroll(steps);
  const step = active >= 0 ? steps[active] : null;

  return (
    <section id="anatomy" aria-labelledby="anatomy-title" className={SECTION}>
      <div ref={trackRef} style={{ height: `${(steps.length + 1.2) * 60}svh` }} className="relative">
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-5 pb-5 pt-[88px] md:px-10 md:pt-[124px]">
          <div aria-hidden="true" className={cn(GLOW, "bg-[radial-gradient(70%_45%_at_50%_45%,rgba(64,103,177,0.3),transparent_75%)]")} />

          <div className="relative z-10 flex items-end justify-between gap-4">
            <div>
              <Heading name={m.name} compact />
            </div>
            <p className="pb-1 text-xs font-medium tabular-nums text-navy/50" aria-hidden="true">
              {step ? `${String(active + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}` : `${steps.length} parts`}
            </p>
          </div>

          <ModelStage id={id} explode={explode} focus={focus} labels={steps} onSelect={onSelect} label={stageLabel(m.name, steps)} className="relative z-10 min-h-0 flex-1" />

          {/* progress: one segment per part; tap to jump */}
          <ol className="relative z-10 flex gap-1.5" aria-label="Components">
            {steps.map((s, i) => (
              <li key={s.part} className="flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}. ${s.name}`}
                  aria-current={i === active ? "step" : undefined}
                  className="block w-full py-2"
                >
                  <span className={cn("block h-1 rounded-full transition-colors duration-500", i < active ? "bg-brand-500/45" : i === active ? "bg-brand-500" : "bg-navy/12")} />
                </button>
              </li>
            ))}
          </ol>

          {/* the current part */}
          <div className="relative z-10 mt-2 min-h-[118px] rounded-2xl border border-navy/10 bg-white/75 p-4 backdrop-blur-md dark:bg-white/[0.04]" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {step ? (
                <motion.div
                  key={step.part}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <span className="text-xs font-medium tabular-nums text-brand-600 dark:text-brand-300">{String(active + 1).padStart(2, "0")}</span>
                  <span className="mt-1 block text-[15px] font-medium text-navy">{step.name}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-navy/65">{step.line}</span>
                </motion.div>
              ) : (
                <motion.p key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm leading-relaxed text-navy/60">
                  Scroll to take the {m.name} apart, one component at a time. Drag sideways to turn it.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function StaticAnatomy({ id }: { id: ModelId }) {
  const m = modelById[id];
  const steps = m.anatomy;
  const explode = useRef(SPREAD);
  const focus = useRef<string | null>(steps[0]?.part ?? null);
  const [active, setActive] = useState(0);
  const pick = (i: number) => {
    setActive(i);
    focus.current = steps[i].part;
  };

  return (
    <section id="anatomy" aria-labelledby="anatomy-title" className={cn(SECTION, "overflow-hidden px-5 py-16 md:px-10 md:py-24")}>
      <Heading name={m.name} />
      <ModelStage
        id={id}
        explode={explode}
        focus={focus}
        labels={steps}
        onSelect={(part) => {
          const i = steps.findIndex((s) => s.part === part);
          if (i >= 0) pick(i);
        }}
        label={stageLabel(m.name, steps)}
        className="mt-6 h-[58svh] min-h-[320px]"
      />
      <ol className="mt-6 grid gap-2 sm:grid-cols-2">
        {steps.map((s, i) => {
          const on = i === active;
          return (
            <li key={s.part}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-pressed={on}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-colors",
                  on ? "border-brand-400 bg-brand-500/15" : "border-navy/10 bg-white/60 hover:border-navy/25 dark:bg-white/[0.03]"
                )}
              >
                <span className="text-xs font-medium tabular-nums text-brand-600 dark:text-brand-300">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-1 block text-[15px] font-medium text-navy">{s.name}</span>
                <span className={cn("mt-1 block text-sm leading-relaxed text-navy/65", !on && "opacity-80")}>{s.line}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
