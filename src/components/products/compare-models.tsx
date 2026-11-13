"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { compareColumns, compareRows, modelById } from "@/data/airguard-models";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/*
 * The four models side by side (Phase 1 AirGuard Product Comparison, claims-safe wording).
 * Ticks draw themselves in row by row as the table scrolls into view; hovering or focusing a
 * column lifts that model. Phones scroll the table sideways with the feature column pinned.
 */
/** Each group's first row number, so ticks can stagger down the whole table. */
const groupStart = compareRows.map((_, gi) => compareRows.slice(0, gi).reduce((n, g) => n + g.rows.length, 0));

export function CompareModels() {
  const [col, setCol] = useState<number | null>(null);

  return (
    <section id="compare" aria-labelledby="compare-title" className="relative bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 xl:px-[4vw]">
        <Reveal blur>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-brand-600 dark:text-brand-300">
            Compare models
          </p>
          <h2 id="compare-title" className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-navy md:text-4xl">
            Compare Models
          </h2>
        </Reveal>

        <div className="relative mt-12 overflow-x-auto [scrollbar-width:thin]" onPointerLeave={() => setCol(null)}>
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <caption className="sr-only">AirGuard XP, MP, LT and CH compared by feature</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-20 w-[22%] bg-background pb-6 align-bottom text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Feature
                </th>
                {compareColumns.map((id, i) => {
                  const m = modelById[id];
                  return (
                    <th
                      key={id}
                      scope="col"
                      onPointerEnter={() => setCol(i)}
                      className={cn("rounded-t-3xl px-4 pb-6 pt-5 align-bottom transition-colors duration-300", col === i && "bg-brand-50 dark:bg-white/5")}
                    >
                      <motion.div animate={{ y: col === i ? -6 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                        <div className="relative mx-auto aspect-[16/10] w-full max-w-[180px]">
                          <Image src={m.image} alt="" fill sizes="180px" className="object-contain" />
                        </div>
                        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-500">{m.role}</p>
                        <p className="text-lg font-medium text-navy">{m.name}</p>
                      </motion.div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((g, gi) => (
                <Fragment key={g.group}>
                  <tr>
                    <th colSpan={5} scope="colgroup" className="sticky left-0 bg-background pb-3 pt-8 text-xs font-medium uppercase tracking-[0.08em] text-navy">
                      {g.group}
                    </th>
                  </tr>
                  {g.rows.map((r, ri) => {
                    const row = groupStart[gi] + ri;
                    return (
                      <tr key={r.label} className="group">
                        <th scope="row" className="sticky left-0 z-10 border-t border-border bg-background py-3.5 pr-4 font-normal text-navy/80">
                          {r.label}
                        </th>
                        {r.cells.map((c, i) => (
                          <td
                            key={i}
                            onPointerEnter={() => setCol(i)}
                            className={cn(
                              "border-t border-border px-4 py-3.5 text-center transition-colors duration-300",
                              col === i && "bg-brand-50 dark:bg-white/5"
                            )}
                          >
                            <Cell value={c} row={row} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          *2021 specification sheets.
        </p>
      </div>
    </section>
  );
}

function Cell({ value, row }: { value: boolean | string; row: number }) {
  const reduce = useMotionPreference();
  if (value === true) {
    return (
      <span className="inline-grid size-7 place-items-center rounded-full bg-brand-500/10">
        <svg viewBox="0 0 24 24" className="size-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <motion.path
            d="M4.5 12.5l5 5L19.5 7"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: Math.min(row, 16) * 0.04, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-navy/25">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No</span>
      </span>
    );
  }
  return <span className="text-sm text-navy">{value}</span>;
}
