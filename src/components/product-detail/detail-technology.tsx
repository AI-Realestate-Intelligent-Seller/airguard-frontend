"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { techTabs } from "@/data/airguard-technology";
import { modelById, type ModelId } from "@/data/airguard-models";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";
import { type } from "@/components/products/type";

const EASE = [0.16, 1, 0.3, 1] as const;
/** Each image's own backdrop (white render, grey beam diagram, transparent cut-outs). */
const PANEL_BG: Record<string, string> = {
  lighting: "#ffffff",
  precision: "#c5c5c5",
  interface: "linear-gradient(160deg,#f4f6fa,#dfe4ed)",
  ergonomics: "linear-gradient(160deg,#f4f6fa,#dfe4ed)",
};

/**
 * Technology, after airguardhealth.com/technology: lighting, precision lighting, the XP camera and
 * interface, and ergonomics, each with the site's heading, lines, specifications and images.
 * Tabs (arrow keys too) crossfade the image; the lighting colours tint the glow behind it on hover.
 * Shown for the models that have these features (XP, MP).
 */
export function DetailTechnology({ id }: { id: ModelId }) {
  const tabs = techTabs.filter((t) => t.models.includes(id));
  const m = modelById[id];
  const reduce = useMotionPreference();
  const [active, setActive] = useState(0);
  const [tint, setTint] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  if (tabs.length === 0) return null;
  const t = tabs[active];

  const select = (i: number) => {
    const n = (i + tabs.length) % tabs.length;
    setActive(n);
    setTint(null);
    tabRefs.current[n]?.focus();
  };

  return (
    <section id="technology" aria-labelledby="tech-title" className="scroll-mt-24 bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 xl:px-[4vw]">
        <p className={type.eyebrow}>{m.name}</p>
        <h2 id="tech-title" className={`mt-3 ${type.h2}`}>
          Technology
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-14">
          <div>
            <div
              role="tablist"
              aria-label={`${m.name} technology`}
              onKeyDown={(e) => {
                const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
                if (!step) return;
                e.preventDefault();
                select(active + step);
              }}
              className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-0 lg:overflow-visible"
            >
              {tabs.map((tab, i) => {
                const on = i === active;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="tech-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => select(i)}
                    className={cn(
                      "relative shrink-0 rounded-full border px-4 py-2 text-left transition-colors lg:rounded-none lg:border-0 lg:border-t lg:border-border lg:px-0 lg:py-4",
                      on ? "border-brand-500 bg-brand-500 text-white lg:bg-transparent lg:text-navy" : "border-border text-navy/60 hover:text-navy"
                    )}
                  >
                    <span className="hidden text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground lg:block">{tab.section}</span>
                    <span className="text-sm font-medium lg:mt-1 lg:block lg:text-base">{tab.title}</span>
                    {on && (
                      <motion.span
                        layoutId="tech-tab-bar"
                        className="absolute -top-px left-0 hidden h-0.5 w-full bg-brand-500 lg:block"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mt-6 border-t border-border pt-6"
              >
                {t.lines.map((l) => (
                  <p key={l} className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
                    {l}
                  </p>
                ))}
                {t.swatches && (
                  <ul className="mt-5 grid grid-cols-2 gap-2">
                    {t.swatches.map((s) => (
                      <li key={s.name}>
                        <button
                          type="button"
                          onPointerEnter={() => setTint(s.hex)}
                          onPointerLeave={() => setTint(null)}
                          onFocus={() => setTint(s.hex)}
                          onBlur={() => setTint(null)}
                          className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-colors hover:border-navy/30"
                        >
                          <span aria-hidden="true" className="size-4 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: s.hex, boxShadow: `0 0 14px ${s.hex}` }} />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-navy">{s.name}</span>
                            <span className="block text-xs tabular-nums text-muted-foreground">{s.value}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {t.specs.length > 0 && (
                  <ul className="mt-4 border-b border-border">
                    {t.specs.map((s, i) => (
                      <motion.li
                        key={s}
                        initial={reduce ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45, delay: 0.05 * i, ease: EASE }}
                        className="flex gap-3 border-t border-border py-2.5 text-sm text-navy/85"
                      >
                        <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-brand-500" />
                        {s}
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* image */}
          <div id="tech-panel" role="tabpanel" aria-label={t.title} className="relative">
            <div
              className="relative aspect-[5/3] overflow-hidden rounded-3xl shadow-[0_30px_60px_-38px_rgba(23,34,54,0.5)] transition-[background] duration-700"
              style={{ background: PANEL_BG[t.id] }}
            >
              <motion.div
                aria-hidden="true"
                animate={{ opacity: tint ? 0.55 : 0 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply"
                style={{ background: tint ? `radial-gradient(60% 60% at 50% 55%, ${tint}, transparent 75%)` : undefined }}
              />
              <AnimatePresence initial={false}>
                <motion.div
                  key={t.id}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.05, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: EASE }}
                  className="absolute inset-0"
                >
                  <Image
                    src={t.image}
                    alt={t.alt}
                    fill
                    unoptimized={t.id === "lighting"} // animated WebP: served as-is so it keeps animating
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {t.inset && (
                <motion.div
                  key={`${t.id}-inset`}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, rotate: -2 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
                  className="relative -mt-16 ml-auto w-[46%] overflow-hidden rounded-2xl border border-white bg-[#fff] shadow-[0_24px_50px_-24px_rgba(23,34,54,0.55)] sm:-mt-24 lg:absolute lg:-bottom-8 lg:-left-8 lg:mt-0 lg:ml-0 lg:w-[38%] dark:border-white/10"
                >
                  <div className="relative aspect-[5/4]">
                    <Image src={t.inset.image} alt={t.inset.alt} fill sizes="(min-width: 1024px) 22vw, 46vw" className="object-contain p-2" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
