"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarCheck, FileText, Phone, Plus, Ruler } from "lucide-react";
import { faqs, salesPhone } from "@/data/airguard-models";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { Reveal } from "@/components/motion/reveal";
import { TiltIn } from "@/components/motion/tilt-in";
import { WordReveal } from "@/components/motion/word-reveal";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/*
 * Proof, written to the Phase 1 claims register: what each model is (substantiated features),
 * how the barrier works (qualified mechanism wording) and, just as plainly, what we don't claim.
 */
const proof = [
  {
    label: "Substantiated",
    title: "Features",
    points: [
      "Four models: XP, MP, LT and CH.",
      "XP: integrated HD camera, magnification and adjustable procedure lighting.",
      "MP: aerosol guard with integrated lighting.",
      "LT: designed for practices using existing suction.",
      "CH: flexible mounting options.",
    ],
  },
  {
    label: "Qualified",
    title: "How it works",
    points: ["Designed to act as a physical barrier and help direct aerosol and splatter toward suction."],
  },
  {
    label: "Not claimed",
    title: "What we don't say",
    points: [
      "No percentage reduction without direct test data.",
      "Magnification complements loupes; it doesn't replace them.",
      "USB transfer today; wireless is a future consideration.",
    ],
  },
];

export function ProofSection() {
  return (
    <section id="proof" aria-labelledby="proof-title" className="relative bg-secondary/60 py-20 md:py-28 dark:bg-[#111b2e]">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 xl:px-[4vw]">
        <Reveal blur>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-brand-600 dark:text-brand-300">
              Claims
            </p>
            <h2 id="proof-title" className="mt-3 text-3xl font-medium tracking-tight text-navy md:text-4xl">
              What we can say.
            </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {proof.map((p, i) => (
            <TiltIn key={p.label} delay={i * 0.08} angle={10}>
              <article
                className={cn(
                  "smooth-card flex h-full flex-col rounded-3xl border p-7",
                  i === 2 ? "border-brand-500/30 bg-brand-500 text-white" : "border-border bg-card"
                )}
              >
                <p className={cn("text-[11px] font-medium uppercase tracking-[0.08em]", i === 2 ? "text-white/70" : "text-brand-500")}>
                  0{i + 1} · {p.label}
                </p>
                <h3 className={cn("mt-3 text-2xl font-medium", i === 2 ? "text-white" : "text-navy")}>{p.title}</h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {p.points.map((pt) => (
                    <li key={pt} className={cn("flex gap-3 text-sm leading-relaxed", i === 2 ? "text-white/85" : "text-muted-foreground")}>
                      <span aria-hidden="true" className={cn("mt-2 size-1.5 shrink-0 rounded-full", i === 2 ? "bg-[#fff]" : "bg-brand-500")} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </article>
            </TiltIn>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useMotionPreference();
  const base = useId();
  return (
    <section id="faqs" aria-labelledby="faq-title" className="relative bg-background py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 md:px-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 xl:px-[4vw]">
        <Reveal blur className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-brand-600 dark:text-brand-300">
            FAQs
          </p>
          <h2 id="faq-title" className="mt-3 text-3xl font-medium tracking-tight text-navy md:text-4xl">
            FAQs
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
            <a href={salesPhone.href} className="font-medium text-navy underline-offset-4 hover:underline">
              {salesPhone.label}
            </a>
          </p>
        </Reveal>
        <ul className="border-b border-border">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            const id = `${base}-${i}`;
            return (
              <li key={f.q} className="border-t border-border">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium text-navy"
                  >
                    <span className="transition-colors group-hover:text-brand-500">{f.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn("grid size-9 shrink-0 place-items-center rounded-full border transition-colors", isOpen ? "border-brand-500 bg-brand-500 text-white" : "border-border")}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={id}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 pr-14 text-base leading-relaxed text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** The Phase 2 conversion flows for AirGuard. */
const actions = [
  { icon: FileText, title: "Request a quote", cta: "Get a quote" },
  { icon: CalendarCheck, title: "Book a demo", cta: "Book a demo" },
  { icon: Ruler, title: "Check compatibility", cta: "Check my fit" },
];

export function ProductsCta() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-[#172236] py-20 text-white md:py-28 dark:bg-[#0c1424]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 bottom-[-30%] size-[620px] rounded-full bg-brand-500/30 blur-[130px]" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10 xl:px-[4vw]">
        <h2 id="cta-title" className="max-w-3xl text-3xl font-medium tracking-tight md:text-5xl">
          <WordReveal text="Ready to Purchase?" />
        </h2>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {actions.map((a, i) => (
            <li key={a.title}>
              <Reveal delay={0.1 + i * 0.08} className="h-full">
                <Link
                  href="/contact"
                  className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition-[background-color,border-color,transform] duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <a.icon className="size-6 text-brand-300" aria-hidden="true" />
                  <span className="mt-6 text-xl font-medium">{a.title}</span>
                  <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-medium text-brand-200">
                    {a.cta}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal delay={0.3} className="mt-10">
          <a href={salesPhone.href} className="inline-flex items-center gap-3 text-sm text-white/70 hover:text-white">
            <span className="grid size-9 place-items-center rounded-full border border-white/20">
              <Phone className="size-4" aria-hidden="true" />
            </span>
            Call {salesPhone.label}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
