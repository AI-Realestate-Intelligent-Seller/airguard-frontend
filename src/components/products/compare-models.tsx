"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { compareColumns, compareRows, modelById } from "@/data/airguard-models";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/*
 * The four models side by side (Phase 1 AirGuard Product Comparison, claims-safe wording).
 * Ticks draw themselves in row by row as the table scrolls into view; hovering or focusing a
 * column lifts that model. Phones get their own view instead (MobileCompare): any two models
 * side by side, feature by feature, with a "differences only" switch.
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

        <MobileCompare />

        <div className="relative mt-12 overflow-x-auto [scrollbar-width:thin] max-md:hidden" onPointerLeave={() => setCol(null)}>
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

/** Phones: two models side by side. Each pick is a native select (the phone's own picker). */
function MobileCompare() {
  const [pick, setPick] = useState<[number, number]>([0, 1]);
  const [diffOnly, setDiffOnly] = useState(false);
  const groups = compareRows
    .map((g) => ({ ...g, rows: g.rows.filter((r) => !diffOnly || r.cells[pick[0]] !== r.cells[pick[1]]) }))
    .filter((g) => g.rows.length > 0);
  let row = 0;

  return (
    <div className="mt-8 md:hidden">
      {/* the two models, pinned under the site bar while the features scroll past */}
      <div className="sticky top-[60px] z-10 -mx-5 border-b border-border bg-background/95 px-5 pb-3 pt-3 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3">
          {pick.map((ci, slot) => {
            const m = modelById[compareColumns[ci]];
            return (
              <div key={slot} className="rounded-2xl border border-border bg-card p-3">
                <div className="relative mx-auto aspect-[16/10] w-full max-w-[140px]">
                  <Image src={m.image} alt="" fill sizes="140px" className="object-contain" />
                </div>
                <label className="mt-2 block">
                  <span className="sr-only">{slot === 0 ? "First model" : "Second model"}</span>
                  <select
                    value={ci}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPick((p) => {
                        const next: [number, number] = [p[0], p[1]];
                        // Choosing the other slot's model swaps the two.
                        if (v === p[1 - slot]) next[1 - slot] = p[slot];
                        next[slot] = v;
                        return next;
                      });
                    }}
                    className="h-10 w-full rounded-full border border-navy/15 bg-background px-3 text-sm font-medium text-navy focus-visible:outline-2 focus-visible:outline-brand-400"
                  >
                    {compareColumns.map((id, i) => (
                      <option key={id} value={i}>
                        {modelById[id].name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-1.5 text-center text-[11px] text-muted-foreground">{m.role}</p>
              </div>
            );
          })}
        </div>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm text-navy">
          Differences only
          <button
            type="button"
            role="switch"
            aria-checked={diffOnly}
            onClick={() => setDiffOnly((d) => !d)}
            className="relative h-7 w-12 rounded-full bg-navy/15 transition-colors aria-checked:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <span className={cn("absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform", diffOnly && "translate-x-5")} />
          </button>
        </label>
      </div>

      {groups.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">These two models match on every listed feature.</p>
      )}
      {groups.map((g) => (
        <section key={g.group} aria-label={g.group} className="pt-6">
          <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-navy">{g.group}</h3>
          <dl className="mt-2">
            {g.rows.map((r) => {
              const n = row++;
              return (
                <div key={r.label} className="border-t border-border py-3">
                  <dt className="text-[13px] text-navy/70">{r.label}</dt>
                  <dd className="mt-2 grid grid-cols-2 gap-3 text-center">
                    {pick.map((ci, slot) => (
                      <span key={slot} className="grid min-h-9 place-items-center rounded-xl bg-muted/50 px-2 py-1.5">
                        <span className="sr-only">{modelById[compareColumns[ci]].name}: </span>
                        <Cell value={r.cells[ci]} row={n} />
                      </span>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
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
            transition={{ duration: 0.5, delay: Math.min(row, 16) * 0.04, ease: EASE }}
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
