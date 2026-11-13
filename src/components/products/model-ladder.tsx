"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { Check } from "lucide-react";
import { capabilities, ladderOrder, modelById, type ModelId } from "@/data/airguard-models";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/*
 * "Climb the range": a pinned scroll scene (desktop). Four screens of scrolling climb the
 * AirGuard ladder from CH to XP. On the left a rail fills and each rung lights as you reach it;
 * in the middle the product shot rises out of a blur into place and the last one sinks away
 * behind it. The huge outlined model code behind it only comes in once that shot has arrived,
 * and stays out while shots hand over. On the right the capability checklist switches
 * each line on or off for the model in view, with a running count.
 * Phones, tablets and reduced motion get the same content as a plain stacked list.
 */
const EASE = [0.16, 1, 0.3, 1] as const;
const STEPS = ladderOrder.length;

export function ModelLadder() {
  return (
    <section id="ladder" aria-label="The AirGuard range" className="relative bg-background">
      <PinnedLadder />
      <StackedLadder />
    </section>
  );
}

function Heading({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-brand-600 dark:text-brand-300">
        The AirGuard range
      </p>
      <h2 className="mt-3 text-3xl font-medium tracking-tight text-navy md:text-4xl">
        A four-model technology ladder.
      </h2>
    </div>
  );
}

function PinnedLadder() {
  const reduce = useMotionPreference();
  return reduce ? null : <PinnedLadderScene />;
}

function PinnedLadderScene() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  // A soft follow so the scene glides rather than ticks with the wheel.
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  // Each model holds still for most of its scroll segment and hands over in a short window, so a
  // visitor who stops scrolling always sees one shot fully in place (and its code behind it).
  const stepF = useTransform(p, (v) => {
    const r = Math.min(STEPS - 1, Math.max(0, v * STEPS - 0.15));
    const k = Math.floor(r);
    const x = Math.min(1, Math.max(0, (r - k - 0.45) / 0.4));
    return k + x * x * (3 - 2 * x);
  });
  const [step, setStep] = useState(0);
  useMotionValueEvent(stepF, "change", (v) => setStep(Math.round(v)));
  const fill = useTransform(p, [0.04, 0.9], ["0%", "100%"]);
  const id = ladderOrder[step];
  const model = modelById[id];
  const count = capabilities.filter((c) => c.models.includes(id)).length;
  // 1 when a shot sits in place, 0 mid-handover: gates the model code behind it.
  const settled = useTransform(stepF, (v) => Math.max(0, 1 - Math.abs(v - Math.round(v)) * 5));

  return (
    <div ref={trackRef} className="relative hidden h-[460svh] lg:block">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        {/* Full-bleed: the product column takes most of the screen so each model reads large */}
        <div className="grid h-full w-full grid-cols-[minmax(0,0.85fr)_minmax(0,1.9fr)_minmax(0,0.7fr)] items-center gap-6 px-8 pt-20 xl:gap-10 xl:px-14">
          {/* Left: heading + the ladder rail */}
          <div>
            <Heading />
            <ol className="relative mt-10 flex flex-col-reverse gap-6 pl-8">
              <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-px bg-navy/10" />
              <motion.span aria-hidden="true" style={{ height: fill }} className="absolute bottom-2 left-[7px] w-px origin-bottom bg-brand-500" />
              {ladderOrder.map((mid, i) => {
                const m = modelById[mid];
                const reached = i <= step;
                return (
                  <li key={mid} className="relative">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -left-8 top-1 grid size-[15px] place-items-center rounded-full border transition-all duration-500",
                        reached ? "border-brand-500 bg-brand-500 shadow-[0_0_0_5px_rgba(64,103,177,0.15)]" : "border-navy/20 bg-background"
                      )}
                    >
                      {i === step && <span className="size-1.5 animate-ping rounded-full bg-[#fff]" />}
                    </span>
                    <p className={cn("text-[11px] font-medium uppercase tracking-[0.08em] transition-colors duration-500", i === step ? "text-brand-500" : "text-muted-foreground")}>
                      Step {i + 1} · {m.role}
                    </p>
                    <p className={cn("mt-0.5 text-lg font-medium transition-colors duration-500", reached ? "text-navy" : "text-navy/35")}>{m.name}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Middle: the product shots, rising in and sinking away */}
          <div className="relative h-[min(80svh,880px)]">
            {/* The model code: in only after its shot has landed (delay), out while shots hand over (settled) */}
            <motion.div aria-hidden="true" style={{ opacity: settled }} className="pointer-events-none absolute inset-0">
              <motion.span
                key={id}
                initial={{ opacity: 0, scale: 1.25, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
                className="absolute inset-0 grid select-none place-items-center text-[26vw] font-bold leading-none tracking-[-0.04em] text-transparent [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--brand-500)_20%,transparent)]"
              >
                {model.code}
              </motion.span>
            </motion.div>
            <div aria-hidden="true" className="absolute inset-x-[10%] bottom-[5%] h-[12%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(23,34,54,0.22),transparent)] blur-md dark:bg-[radial-gradient(closest-side,rgba(0,0,0,0.6),transparent)]" />
            {ladderOrder.map((mid, i) => (
              <LadderShot key={mid} id={mid} i={i} stepF={stepF} />
            ))}
          </div>

          {/* Right: the capability checklist */}
          <div>
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-navy">Capabilities</p>
              <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                <motion.span key={count} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-block font-semibold text-brand-500">
                  {count}
                </motion.span>{" "}
                of {capabilities.length}
              </p>
            </div>
            <ul>
              {capabilities.map((c, i) => {
                const on = c.models.includes(id);
                return (
                  <li key={c.label} className="flex items-center gap-3 border-b border-border py-2.5">
                    <motion.span
                      aria-hidden="true"
                      animate={{
                        scale: on ? 1 : 0.7,
                        backgroundColor: on ? "var(--brand-500)" : "rgba(0,0,0,0)",
                        borderColor: on ? "var(--brand-500)" : "color-mix(in srgb, var(--navy-ink) 18%, transparent)",
                      }}
                      transition={{ type: "spring", stiffness: 420, damping: 22, delay: on ? i * 0.03 : 0 }}
                      className="grid size-5 shrink-0 place-items-center rounded-full border"
                    >
                      <motion.span animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.4 }} transition={{ duration: 0.3, delay: on ? i * 0.03 + 0.08 : 0 }}>
                        <Check className="size-3 text-white" strokeWidth={3} />
                      </motion.span>
                    </motion.span>
                    <span className={cn("text-sm transition-colors duration-500", on ? "text-navy" : "text-navy/35 line-through decoration-navy/20")}>
                      {c.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium uppercase tracking-[0.08em] text-navy">Best for · </span>
              {model.bestFor}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One product shot. It rises from below in focus as its step arrives, and sinks back blurred as the next one comes. */
function LadderShot({ id, i, stepF }: { id: ModelId; i: number; stepF: MotionValue<number> }) {
  const m = modelById[id];
  const d = useTransform(stepF, (v) => v - i); // <0 not yet, 0 in view, >0 passed
  const y = useTransform(d, (v) => `${(v < 0 ? -v * 40 : -v * 22).toFixed(2)}%`);
  const scale = useTransform(d, (v) => (v < 0 ? 1 + v * 0.18 : 1 - v * 0.22));
  const opacity = useTransform(d, (v) => Math.max(0, 1 - Math.abs(v) * 1.6));
  const filter = useTransform(d, (v) => `blur(${Math.min(14, Math.abs(v) * 16).toFixed(1)}px)`);
  const rotate = useTransform(d, (v) => v * -6);
  return (
    <motion.div style={{ y, scale, opacity, filter, rotate }} className="absolute inset-[2%_0%_8%] will-change-transform">
      <Image src={m.image} alt={m.name} fill sizes="60vw" className="object-contain drop-shadow-[0_30px_30px_rgba(23,34,54,0.2)]" />
    </motion.div>
  );
}

/** Phones, tablets and reduced motion: the ladder as a plain list, simplest first. */
function StackedLadder() {
  const reduce = useMotionPreference();
  return (
    <div className={cn("mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24", !reduce && "lg:hidden")}>
      <Heading />
      <ol className="mt-10 grid gap-5 md:grid-cols-2">
        {ladderOrder.map((id, i) => {
          const m = modelById[id];
          return (
            <li key={id}>
              <Reveal delay={i * 0.06} className="h-full rounded-3xl border border-border bg-card p-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-brand-500">
                  Step {i + 1} · {m.role}
                </p>
                <div className="relative mt-4 aspect-[16/9]">
                  <Image src={m.image} alt={m.name} fill sizes="(min-width: 768px) 45vw, 90vw" className="object-contain" />
                </div>
                <h3 className="mt-4 text-2xl font-medium text-navy">{m.name}</h3>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {capabilities
                    .filter((c) => c.models.includes(id))
                    .map((c) => (
                      <li key={c.label} className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700 dark:bg-white/10 dark:text-brand-200">
                        {c.label}
                      </li>
                    ))}
                </ul>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
