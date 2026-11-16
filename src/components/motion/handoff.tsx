"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useXpLight } from "@/lib/xp-light";

/*
 * A pinned handoff between two home page sections, carrying a short statement of how they relate.
 *
 * When the visitor reaches the end of `children`, it holds in place (pinned by its bottom edge,
 * so a section taller than the screen shows its last screen) for 1.5 screens of scrolling:
 *   0 – 0.33  the held section recedes and darkens; two words appear and join
 *             ("Health" → "Wellness"), then one line explains the link
 *   0.33 – 1  `next` rises over it as a card, its rounded top corners squaring off as it lands;
 *             the words clear before the card reaches them
 * Then the held section lets go behind it. Only transforms and opacity move, so it stays smooth
 * on phones. The words sit on a deep navy wash, so every colour reads in light and dark mode.
 * Reduced motion: the two sections simply follow each other.
 *
 * `light` (AirGuard → King Hydrogen): the XP's current LED colour glows below the words, sinks
 * and turns water-blue, then lands as a blue light along the top edge of the rising card, so the
 * XP's light hands off to the Aurora's water.
 */
const WATER = "#2557f2";
const HOLD_SVH = 150; // keep in step with the spacer (h-[150svh]); `next` overlaps the last 100

export function Handoff({
  children,
  next,
  eyebrow,
  from,
  to,
  accent,
  line,
  light = false,
}: {
  children: ReactNode;
  next: ReactNode;
  eyebrow: string;
  /** The word for the section being left. */
  from: string;
  /** The word for the section arriving. */
  to: string;
  /** The arriving brand's colour, lightened to read on navy. */
  accent: string;
  /** One sentence on how the two relate. */
  line: string;
  /** Carry the XP's light down into the next section's water (AirGuard → King Hydrogen). */
  light?: boolean;
}) {
  const ledColor = useXpLight();
  const reduce = useMotionPreference();
  const heldRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);
  // Sticky offset that pins the held section by its bottom edge: min(0, screen − its height).
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const el = heldRef.current;
    if (!el || reduce) return;
    const measure = () => setTop(Math.min(0, window.innerHeight - el.offsetHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reduce]);

  // 0 when the held section's bottom meets the bottom of the screen, 1 when `next` reaches the top.
  const { scrollYProgress: p } = useScroll({ target: holdRef, offset: ["start end", "end end"] });
  const scale = useTransform(p, [0, 1], [1, 0.93]);
  const dim = useTransform(p, [0, 0.2], [0, 0.88]);
  const words = useTransform(p, [0.58, 0.68], [1, 0]); // clear before the rising card reaches them
  const fromIn = useTransform(p, [0.03, 0.13], [0, 1]);
  const fromY = useTransform(p, [0.03, 0.13], [18, 0]);
  const join = useTransform(p, [0.11, 0.21], [0, 1]);
  const toIn = useTransform(p, [0.17, 0.27], [0, 1]);
  const toY = useTransform(p, [0.17, 0.27], [18, 0]);
  const lineIn = useTransform(p, [0.24, 0.34], [0, 1]);
  const lineY = useTransform(p, [0.24, 0.34], [12, 0]);
  const radius = useTransform(p, [0.33, 0.9, 1], [36, 20, 0]);
  // light → water: the glow fades up in the LED colour, sinks, turns blue, and lands on the card's edge
  const orbIn = useTransform(p, [0.02, 0.14, 0.5, 0.62], [0, 1, 1, 0]);
  const orbY = useTransform(p, [0, 0.45], ["0svh", "26svh"]);
  const orbScale = useTransform(p, [0, 0.45], [0.8, 1.25]);
  const toWater = useTransform(p, [0.14, 0.36], [0, 1]);
  const edge = useTransform(p, [0.33, 0.48, 0.86, 1], [0, 1, 1, 0]);

  if (reduce) {
    return (
      <>
        {children}
        {next}
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <div ref={heldRef} className={top === null ? "relative z-30" : "sticky z-30"} style={top === null ? undefined : { top }}>
          {/* scales from the middle of the visible last screen */}
          <motion.div style={{ scale, transformOrigin: "50% calc(100% - 50svh)" }}>{children}</motion.div>

          {/* the last screen: a navy wash, and the words */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[100svh]">
            <motion.div className="absolute inset-0 bg-[#0a1424]" style={{ opacity: dim }} />
            {light && (
              <motion.div
                aria-hidden="true"
                style={{ opacity: orbIn, y: orbY, scale: orbScale }}
                className="absolute left-1/2 top-[58%] size-[min(70vw,440px)] -translate-x-1/2 -translate-y-1/2"
              >
                <span className="absolute inset-0 rounded-full blur-2xl" style={{ background: `radial-gradient(closest-side, ${ledColor}cc, ${ledColor}33 55%, transparent)` }} />
                <motion.span
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ opacity: toWater, background: `radial-gradient(closest-side, ${WATER}e6, ${WATER}40 55%, transparent)` }}
                />
              </motion.div>
            )}
            <motion.div
              style={{ opacity: words }}
              className="absolute inset-x-0 top-[17%] mx-auto flex max-w-3xl flex-col items-center px-6 text-center md:top-[20%]"
            >
              <motion.p style={{ opacity: fromIn }} className="text-xs font-medium uppercase tracking-[0.08em] text-white/60">
                {eyebrow}
              </motion.p>
              <div className="mt-4 flex max-w-full items-center justify-center gap-2 sm:gap-3 md:gap-5">
                <motion.span style={{ opacity: fromIn, y: fromY }} className="text-[clamp(1.5rem,7vw,2.25rem)] font-medium tracking-tight text-white md:text-6xl">
                  {from}
                </motion.span>
                <motion.span
                  aria-hidden="true"
                  style={{ scaleX: join, background: `linear-gradient(90deg, #ffffff, ${accent})` }}
                  className="h-px w-5 shrink-0 origin-left sm:w-10 md:w-20"
                />
                <motion.span style={{ opacity: toIn, y: toY, color: accent }} className="text-[clamp(1.5rem,7vw,2.25rem)] font-medium tracking-tight md:text-6xl">
                  {to}
                </motion.span>
              </div>
              <motion.p style={{ opacity: lineIn, y: lineY }} className="mt-4 max-w-xl text-balance text-sm leading-relaxed text-white/80 sm:text-base md:mt-5 md:text-lg">
                {line}
              </motion.p>
            </motion.div>
          </div>
        </div>
        {/* the hold: 0.5 screen for the words, then one screen while `next` rises over the held section */}
        <div ref={holdRef} aria-hidden="true" className="h-[150svh]" data-hold-svh={HOLD_SVH} />
      </div>

      <motion.div
        className="relative z-[35] -mt-[100svh] overflow-clip shadow-[0_-24px_60px_-28px_rgba(0,0,0,0.6)]"
        style={{ borderTopLeftRadius: radius, borderTopRightRadius: radius }}
      >
        {light && (
          // the light arriving as water: a blue glow and a bright waterline along the card's top edge
          <motion.div aria-hidden="true" style={{ opacity: edge }} className="pointer-events-none absolute inset-x-0 top-0 z-[60] h-40">
            <span className="absolute inset-0" style={{ background: `radial-gradient(60% 100% at 50% 0%, ${WATER}8c, transparent 70%)` }} />
            <span className="absolute inset-x-[8%] top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, #9cc0ff, transparent)` }} />
          </motion.div>
        )}
        {next}
      </motion.div>
    </>
  );
}
