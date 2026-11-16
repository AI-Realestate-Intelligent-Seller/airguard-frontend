"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Camera, Check, Lightbulb, RotateCcw, Wind, X } from "lucide-react";
import { airguardModels, fitQuestions, modelById, type ModelId } from "@/data/airguard-models";
import { AddToCart } from "@/components/cart/add-to-cart";
import { formatUsd } from "@/lib/cart";
import { type } from "@/components/products/type";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/*
 * Fit finder: three yes/no questions (fitQuestions) to one recommended model, following the
 * Product Comparison "best-fit routing" ([D]):
 *   camera and magnification            → XP
 *   integrated lighting (no camera)     → MP
 *   already own extra-oral suction      → LT
 *   none of these                       → CH (simple chair/furniture-mounted barrier)
 *
 * Every answer updates the four models beside the question at once: models that no longer fit
 * dim and say why, the leading model lifts. Big Yes / No tiles, Y / N / Backspace on the
 * keyboard, a back step, and a result card with Shop now, a pre-filled quote and the details.
 */

type Key = keyof typeof fitQuestions;
type Answers = Partial<Record<Key, boolean>>;

const STEPS: { key: Key; icon: typeof Wind; yes: string; no: string; hint: string }[] = [
  {
    key: "suction",
    icon: Wind,
    yes: "Yes, we have one",
    no: "Not yet",
    hint: "AirGuard LT slides onto most oral suction support systems.",
  },
  {
    key: "imaging",
    icon: Camera,
    yes: "Yes, we document cases",
    no: "No, not needed",
    hint: "Only the XP has the integrated HD camera and magnification.",
  },
  {
    key: "lighting",
    icon: Lightbulb,
    yes: "Yes, light the field",
    no: "No, our lighting is fine",
    hint: "XP and MP have integrated, dimmable lighting.",
  },
];

/** Why a model drops out, for the answers given so far (null = still a fit). */
function ruledOut(id: ModelId, a: Answers): string | null {
  if (a.imaging === true && id !== "xp") return "No camera";
  if (a.imaging === false && id === "xp") return "Camera not needed";
  if (a.lighting === true && (id === "lt" || id === "ch")) return "No integrated lighting";
  if (a.lighting === false && id === "mp") return "Lighting not needed";
  if (a.suction === false && id === "lt") return "Needs an existing suction unit";
  return null;
}

/** The best fit among the models still in play (routing order: XP, MP, LT, CH). */
function bestFit(a: Answers): { pick: ModelId; also: ModelId | null } {
  const fits = (["xp", "mp", "lt", "ch"] as ModelId[]).filter((id) => !ruledOut(id, a));
  let pick: ModelId = "ch";
  if (a.imaging) pick = "xp";
  else if (a.lighting) pick = "mp";
  else if (a.suction) pick = "lt";
  if (!fits.includes(pick)) pick = fits[0] ?? "ch";
  const also = fits.find((id) => id !== pick) ?? null;
  return { pick, also };
}

/** The reasons behind the pick, in the visitor's own answers. */
function reasons(id: ModelId, a: Answers): string[] {
  const r: string[] = [];
  if (id === "xp") r.push("Integrated HD camera and magnification for documenting cases");
  if ((id === "xp" || id === "mp") && a.lighting) r.push("Integrated, dimmable procedure lighting");
  if (id === "xp" || id === "mp") r.push("Extra-oral suction built in");
  if (id === "lt") r.push("Works with the extra-oral suction unit you already own", "Reusable, recyclable shield; height and rotation adjust");
  if (id === "ch") r.push("A simple physical barrier on a flexible arm and adjustable clamp", "Doesn't need a suction unit");
  return r;
}

const quoteHref = (id: ModelId) => `/contact?product=airguard&type=${encodeURIComponent(modelById[id].name)}`;

export function FitFinder() {
  const reduce = useMotionPreference();
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const done = step >= STEPS.length;
  const { pick, also } = useMemo(() => bestFit(answers), [answers]);
  const answeredCount = Object.keys(answers).length;
  const regionRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  const answer = (v: boolean) => {
    const key = STEPS[step].key;
    setAnswers((a) => ({ ...a, [key]: v }));
    setStep((s) => s + 1);
  };
  const back = () => {
    const prev = Math.max(0, step - 1);
    setAnswers((a) => {
      const next = { ...a };
      delete next[STEPS[prev].key];
      return next;
    });
    setStep(prev);
  };
  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  useEffect(() => {
    if (done) resultRef.current?.focus({ preventScroll: true });
  }, [done]);

  // Y / N to answer, Backspace to go back, while the finder has focus or the pointer.
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("a,input,textarea")) return;
    if (!done && (e.key === "y" || e.key === "Y")) answer(true);
    else if (!done && (e.key === "n" || e.key === "N")) answer(false);
    else if (e.key === "Backspace" && step > 0) {
      e.preventDefault();
      back();
    }
  };

  const q = STEPS[Math.min(step, STEPS.length - 1)];
  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 40, filter: "blur(6px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: -40, filter: "blur(6px)" },
      };

  return (
    <section id="fit-finder" aria-labelledby="fit-title" className="relative scroll-mt-20 overflow-hidden bg-[#f3f6fb] py-16 md:py-24 dark:bg-[#0b1322]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(64,103,177,.16),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-5 md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className={type.eyebrow}>Fit finder</p>
            <h2 id="fit-title" className={cn(type.h2, "mt-2")}>
              Which AirGuard fits your operatory?
            </h2>
            <p className={cn(type.body, "mt-3 max-w-[52ch]")}>Three quick questions. Your match updates with every answer.</p>
          </div>
          {/* progress */}
          <div className="flex items-center gap-3" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s.key} className="relative h-1.5 w-12 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
                  animate={{ width: i < step ? "100%" : "0%" }}
                  transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                />
              </span>
            ))}
            <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">{done ? "Done" : `${step + 1} of ${STEPS.length}`}</span>
          </div>
        </div>

        <div
          ref={regionRef}
          tabIndex={-1}
          onKeyDown={onKey}
          className="mt-10 grid gap-6 outline-none lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10"
        >
          {/* ── Left: the question, or the result ── */}
          <div className="relative min-h-[380px] rounded-[28px] border border-border bg-card p-6 shadow-[0_30px_70px_-40px_rgba(23,34,54,.45)] md:p-9">
            <AnimatePresence mode="wait" initial={false}>
              {!done ? (
                <motion.div key={q.key} {...slide} transition={{ duration: reduce ? 0.15 : 0.45, ease: EASE }}>
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-white/5 dark:text-brand-300">
                      <q.icon className="size-6" aria-hidden="true" />
                    </span>
                    {step > 0 && (
                      <button type="button" onClick={back} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-navy">
                        <ArrowLeft className="size-4" aria-hidden="true" /> Back
                      </button>
                    )}
                  </div>
                  <p className="mt-6 text-xs font-medium text-muted-foreground">Question {step + 1}</p>
                  <h3 id="fit-q" className="mt-1 text-2xl font-medium tracking-tight text-navy md:text-[28px] md:leading-tight">
                    {fitQuestions[q.key]}
                  </h3>
                  <div role="group" aria-labelledby="fit-q" className="mt-7 grid gap-3 sm:grid-cols-2">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => answer(v)}
                        data-cta=""
                        className={cn(
                          "group flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
                          v
                            ? "border-brand-500/30 bg-brand-500/[0.06] hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                            : "border-border hover:border-navy/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
                            v ? "bg-brand-500 text-white group-hover:bg-[#fff] group-hover:text-brand-600" : "bg-black/[0.06] text-navy dark:bg-white/10"
                          )}
                        >
                          {v ? <Check className="size-5" aria-hidden="true" /> : <X className="size-5" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0">
                          <span className={cn("block text-base font-medium", v ? "text-navy group-hover:text-white" : "text-navy")}>{v ? "Yes" : "No"}</span>
                          <span className={cn("block text-xs", v ? "text-muted-foreground group-hover:text-white/80" : "text-muted-foreground")}>{v ? q.yes : q.no}</span>
                        </span>
                        <kbd className={cn("ml-auto hidden rounded border px-1.5 text-[10px] md:inline", v ? "border-brand-500/30 text-brand-600 group-hover:border-white/40 group-hover:text-white" : "border-border text-muted-foreground")}>
                          {v ? "Y" : "N"}
                        </kbd>
                      </button>
                    ))}
                  </div>
                  <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />
                    {q.hint}
                  </p>
                </motion.div>
              ) : (
                <motion.div key="result" {...slide} transition={{ duration: reduce ? 0.15 : 0.5, ease: EASE }}>
                  <Result pick={pick} also={also} answers={answers} onRestart={restart} headingRef={resultRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: the four models, narrowing live ── */}
          <div>
            <p className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{done ? "Your match" : answeredCount === 0 ? "All four models" : "Still in the running"}</span>
              <span className="tabular-nums">{airguardModels.filter((m) => !ruledOut(m.id, answers)).length} of 4</span>
            </p>
            <LayoutGroup>
              <ul className="grid grid-cols-2 gap-3" aria-live="polite">
                {airguardModels.map((m) => {
                  const out = ruledOut(m.id, answers);
                  const lead = answeredCount > 0 && m.id === pick && !out;
                  return (
                    <motion.li
                      key={m.id}
                      layout={!reduce}
                      animate={{ opacity: out ? 0.45 : 1, scale: lead ? 1.02 : out ? 0.97 : 1 }}
                      transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
                      className={cn(
                        "relative overflow-hidden rounded-2xl border bg-card p-3 transition-colors",
                        lead ? "border-brand-500 shadow-[0_18px_40px_-22px_rgba(64,103,177,.8)]" : "border-border"
                      )}
                    >
                      <div className={cn("relative aspect-[1.6] transition-[filter] duration-500", out && "grayscale")}>
                        <Image src={m.image} alt="" fill sizes="(min-width:1024px) 220px, 45vw" className="object-contain" />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-navy">{m.name}</span>
                        {lead && (
                          <motion.span
                            layoutId="fit-lead"
                            className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium text-white"
                          >
                            {done ? "Best fit" : "Leading"}
                          </motion.span>
                        )}
                      </div>
                      <p className={cn("mt-0.5 truncate text-xs", out ? "text-[#b42318] dark:text-[#ff8a80]" : "text-muted-foreground")}>{out ?? m.role}</p>
                    </motion.li>
                  );
                })}
              </ul>
            </LayoutGroup>
            {/* answers so far, each one tappable to change */}
            {answeredCount > 0 && (
              <ol className="mt-4 flex flex-wrap gap-2">
                {STEPS.filter((s) => answers[s.key] !== undefined).map((s) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => {
                        const i = STEPS.findIndex((x) => x.key === s.key);
                        setAnswers((a) => Object.fromEntries(Object.entries(a).filter(([k]) => STEPS.findIndex((x) => x.key === k) < i)));
                        setStep(i);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-navy hover:border-brand-500"
                      aria-label={`Change your answer: ${fitQuestions[s.key]}`}
                    >
                      <s.icon className="size-3.5 text-brand-500" aria-hidden="true" />
                      {answers[s.key] ? "Yes" : "No"}
                      <span className="text-muted-foreground">· change</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Result({
  pick,
  also,
  answers,
  onRestart,
  headingRef,
}: {
  pick: ModelId;
  also: ModelId | null;
  answers: Answers;
  onRestart: () => void;
  headingRef: React.Ref<HTMLHeadingElement>;
}) {
  const m = modelById[pick];
  const alt = also ? modelById[also] : null;
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-brand-600 dark:text-brand-300">Your best fit</p>
          <h3 ref={headingRef} tabIndex={-1} className="mt-1 text-3xl font-medium tracking-tight text-navy outline-none md:text-4xl">
            {m.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
        </div>
        <button type="button" onClick={onRestart} className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-navy">
          <RotateCcw className="size-4" aria-hidden="true" /> Start over
        </button>
      </div>
      <div className="mt-4 grid items-center gap-5 sm:grid-cols-[1fr_1.1fr]">
        <div className="relative aspect-[1.6]">
          <Image src={m.image} alt={m.name} fill sizes="(min-width:640px) 280px, 90vw" className="object-contain" />
        </div>
        <ul className="space-y-2">
          {reasons(pick, answers).map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-navy">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <AddToCart id={pick} />
        <Link
          href={quoteHref(pick)}
          data-cta=""
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-navy/15 px-5 text-sm font-medium text-navy hover:border-brand-500 hover:text-brand-500"
        >
          Get a quote
        </Link>
        <Link href={`/products/${pick}`} className="group inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-300">
          See {m.code} in 3D and details
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {m.price === null ? "Price on request" : formatUsd(m.price)}
        {alt && (
          <>
            {" · "}Also consider{" "}
            <Link href={`/products/${alt.id}`} className="font-medium text-navy underline-offset-2 hover:underline">
              {alt.name}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
