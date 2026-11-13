import { ArrowUpRight } from "lucide-react";
import type { evidence } from "@/data/airguard-models";
import { type } from "@/components/products/type";

type Evidence = (typeof evidence)[number];

/** One Evidence Register entry: what it supports, what it does not prove, and the source link. */
export function EvidenceCard({ e, uses }: { e: Evidence; uses?: string[] }) {
  return (
    <article
      id={e.id}
      className="scroll-mt-32 rounded-2xl border border-border bg-card p-6 target:border-brand-500 target:shadow-[0_0_0_4px_rgba(64,103,177,0.15)] md:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className={type.label}>
          {e.id.toUpperCase()} · {e.type}
        </p>
        <a href={e.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
          Open source
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>
      <h3 className={`mt-2 ${type.h3}`}>{e.source}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.finding}</p>
      <dl className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-navy">Supports</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.supports}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-navy">Does not prove</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.notProven}</dd>
        </div>
      </dl>
      {uses && uses.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-border pt-5">
          {uses.map((u) => (
            <li key={u} className="rounded-md bg-secondary px-2.5 py-1 text-xs text-navy/80 dark:bg-white/10">
              {u}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
