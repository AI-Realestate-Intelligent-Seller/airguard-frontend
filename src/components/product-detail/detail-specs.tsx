"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { modelById, type ModelId } from "@/data/airguard-models";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { type } from "@/components/products/type";

const EASE = [0.16, 1, 0.3, 1] as const;

/*
 * Specifications, presented as a technical drawing: the product on a fine grid with dimension
 * lines that draw themselves in (overall sizes from the 2021 spec sheets), beside the spec list.
 * Lines are placed around the image's frame; they indicate overall size, not exact edges.
 */

/** Where each dimension sits around the frame (SVG units 0–100), in data order. */
const PLACES = {
  bottom: { d: "M14 88 H86", ticks: ["M14 84 V92", "M86 84 V92"], label: { left: "50%", top: "93%" }, end: false },
  depth: { d: "M88 78 L96 52", ticks: ["M86 79 L90 77", "M94 51 L98 53"], label: { left: "93%", top: "65%" }, end: true },
  right: { d: "M95 18 V46", ticks: ["M92 18 H98", "M92 46 H98"], label: { left: "92%", top: "32%" }, end: true },
} as const;

export function DetailSpecs({ id }: { id: ModelId }) {
  const m = modelById[id];
  const reduce = useMotionPreference();
  const places = m.drawing.length === 3 ? [PLACES.bottom, PLACES.depth, PLACES.right] : [PLACES.bottom, PLACES.right];

  return (
    <section id="specs" aria-labelledby="specs-title" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 xl:px-[4vw]">
        <p className={type.eyebrow}>{m.name}</p>
        <h2 id="specs-title" className={`mt-3 ${type.h2}`}>
          Specifications
        </h2>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
          {/* drawing */}
          <figure className="relative">
            <div className="relative aspect-[16/11] overflow-hidden rounded-3xl border border-border bg-card [background-image:linear-gradient(color-mix(in_srgb,var(--brand-500)_7%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--brand-500)_7%,transparent)_1px,transparent_1px)] [background-size:28px_28px]">
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 1, ease: EASE }}
                className="absolute inset-[12%_14%_16%_12%]"
              >
                <Image src={m.image} alt={`${m.name}, technical view`} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-contain" />
              </motion.div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-brand-500" aria-hidden="true">
                {m.drawing.map((d, i) => {
                  const pl = places[i];
                  return (
                    <g key={d.label} stroke="currentColor" fill="none" strokeLinecap="round">
                      <motion.path
                        d={pl.d}
                       
                        strokeWidth="0.32"
                        initial={reduce ? false : { pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 1, delay: 0.4 + i * 0.25, ease: EASE }}
                      />
                      {pl.ticks.map((t) => (
                        <motion.path
                          key={t}
                          d={t}
                         
                          strokeWidth="0.32"
                          initial={reduce ? false : { opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true, amount: 0.5 }}
                          transition={{ duration: 0.4, delay: 0.4 + i * 0.25 }}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
              {m.drawing.map((d, i) => {
                const pl = places[i];
                return (
                  <motion.span
                    key={d.label}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6, delay: 1 + i * 0.25, ease: EASE }}
                    style={{ left: pl.label.left, top: pl.label.top }}
                    className={`absolute -translate-y-1/2 whitespace-nowrap rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium tabular-nums text-navy shadow-sm ring-1 ring-border max-sm:text-[10px] ${pl.end ? "-translate-x-full" : "-translate-x-1/2"}`}
                  >
                    {d.label} <span className="text-brand-600 dark:text-brand-300">{d.value}</span>
                  </motion.span>
                );
              })}
            </div>
            <figcaption className="mt-3 text-xs text-muted-foreground">Dimensions from the 2021 AirGuard specification sheets.</figcaption>
          </figure>

          {/* list */}
          <dl className="self-start border-b border-border">
            {m.specs.map((s, i) => (
              <motion.div
                key={s.label}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: EASE }}
                className="group grid gap-1 border-t border-border py-4 transition-colors hover:bg-secondary/50 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6 sm:px-3"
              >
                <dt className="text-sm font-medium text-navy">{s.label}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground group-hover:text-navy/80">{s.value}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
