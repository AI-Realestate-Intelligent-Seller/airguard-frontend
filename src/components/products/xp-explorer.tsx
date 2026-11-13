"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { AirGuardStage } from "@/components/sections/airguard-3d";
import { WordReveal } from "@/components/motion/word-reveal";
import { Reveal } from "@/components/motion/reveal";
import { useMotionPreference } from "@/hooks/use-motion-preference";

/*
 * AirGuard XP up close, on /products. As the section scrolls in, the 3D stage opens out of a
 * rounded card to the full width (an iris widening on the model), then four XP highlights settle
 * into the corners. The model itself is the shared, labelled AirGuardStage.
 */
/** Claims register A-002…A-004 and the XP comparison column. */
const highlights = [
  { k: "Integrated HD camera", v: "With an integrated high-definition screen." },
  { k: "Integrated magnification", v: "For enhanced visualization." },
  { k: "Adjustable lighting", v: "2700K · 6500K · Amber 2200K · Blue 470 nm." },
  { k: "Extra-oral suction", v: "Attachment cuff to your suction unit." },
];

export function XpExplorer() {
  const reduce = useMotionPreference();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.15"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const inset = useTransform(p, [0, 1], [14, 0]);
  const radius = useTransform(p, [0, 1], [48, 28]);
  const clipPath = useTransform([inset, radius], ([i, r]: number[]) => `inset(${i}% ${i * 0.8}% round ${r}px)`);
  const chips = useTransform(p, [0.75, 1], [0, 1]);

  return (
    <section id="explorer" aria-labelledby="explorer-title" className="relative bg-background py-16 md:py-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 xl:px-[4vw]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-brand-600 dark:text-brand-300">
              AirGuard XP
            </p>
            <h2 id="explorer-title" className="mt-3 text-3xl font-medium tracking-tight text-navy md:text-4xl">
              <WordReveal text="The flagship, in 3D." />
            </h2>
          </div>
          <Reveal delay={0.15} className="max-w-sm text-base leading-relaxed text-muted-foreground">
            Drag to turn. Illustrative model.
          </Reveal>
        </div>
      </div>

      <div ref={ref} className="mx-auto mt-10 max-w-[1600px] px-3 md:px-6">
        <motion.div
          style={reduce ? { borderRadius: 28 } : { clipPath }}
          className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(90%_70%_at_50%_45%,#ffffff_0%,#eef2f9_55%,#e2e9f5_100%)] dark:bg-[radial-gradient(90%_70%_at_50%_45%,#1a2a4a_0%,#0f1a30_60%,#0a1222_100%)]"
        >
          <div className="relative h-[64svh] min-h-[400px] lg:h-[min(84svh,820px)]">
            <AirGuardStage />
          </div>

          {/* Highlights settle into the corners once the stage is open (desktop) */}
          <ul className="pointer-events-none absolute inset-0 hidden lg:block">
            {highlights.map((h, i) => (
              <Corner key={h.k} h={h} i={i} chips={chips} still={reduce} />
            ))}
          </ul>
        </motion.div>

        {/* Phones and tablets: the same highlights, below the model */}
        <ul className="mt-6 grid gap-3 px-2 sm:grid-cols-2 lg:hidden">
          {highlights.map((h, i) => (
            <li key={h.k}>
              <Reveal delay={i * 0.05} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-navy">{h.k}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{h.v}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const corners = ["left-8 top-8", "right-8 top-8", "bottom-16 left-8", "bottom-16 right-8"];

/** One highlight card, rising into its corner a beat after the one before. */
function Corner({ h, i, chips, still }: { h: (typeof highlights)[number]; i: number; chips: MotionValue<number>; still: boolean }) {
  const own = useTransform(chips, [i * 0.15, i * 0.15 + 0.55], [0, 1], { clamp: true });
  const y = useTransform(own, [0, 1], [i < 2 ? -16 : 16, 0]);
  return (
    <motion.li
      style={still ? undefined : { opacity: own, y }}
      className={`absolute max-w-[230px] rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_14px_30px_-20px_rgba(23,34,54,0.6)] backdrop-blur-md dark:border-white/10 dark:bg-[#16223a]/80 ${corners[i]}`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-navy">{h.k}</p>
      <p className="mt-1 text-xs leading-relaxed text-navy/65">{h.v}</p>
    </motion.li>
  );
}
