import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, FlaskConical } from "lucide-react";
import { AddToCart } from "@/components/cart/add-to-cart";
import { Reveal } from "@/components/motion/reveal";
import { EvidenceCard } from "@/components/products/evidence-card";
import { type } from "@/components/products/type";
import { evidence, ladderOrder, modelById, salesPhone, type ModelId } from "@/data/airguard-models";
import { formatUsd } from "@/lib/cart";
import { cn } from "@/lib/utils";

const wrap = "mx-auto max-w-[1400px] px-5 md:px-10 xl:px-[4vw]";

/** The documented features, as numbered cards. */
export function DetailFeatures({ id }: { id: ModelId }) {
  const m = modelById[id];
  return (
    <section aria-labelledby="features-title" className="bg-secondary/50 py-20 md:py-28 dark:bg-[#111b2e]">
      <div className={wrap}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Reveal>
            <p className={type.eyebrow}>Features</p>
            <h2 id="features-title" className={`mt-3 ${type.h2}`}>
              {m.name}
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:justify-self-end">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-navy">Best for: </span>
              {m.bestFor}
            </p>
          </Reveal>
        </div>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {m.features.map((f, i) => (
            <li key={f.label}>
              <Reveal delay={i * 0.06} className="h-full">
                <div className="group flex h-full flex-col justify-between gap-10 rounded-2xl border border-border bg-card p-6 transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_24px_40px_-28px_rgba(23,34,54,0.45)]">
                  <span className="text-xs font-medium tabular-nums text-brand-600 dark:text-brand-300">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-lg font-medium leading-snug tracking-tight text-navy">{f.label}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Evidence Register entries for this model. */
export function DetailResearch({ id }: { id: ModelId }) {
  const m = modelById[id];
  const sources = evidence.filter((e) => m.research.includes(e.id));
  return (
    <section id="research" aria-labelledby="research-title" className="scroll-mt-24 bg-background py-20 md:py-28">
      <div className={wrap}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className={type.eyebrow}>Evidence</p>
            <h2 id="research-title" className={`mt-3 ${type.h2}`}>
              Scientific research
            </h2>
          </Reveal>
          <div className="flex flex-col gap-4">
            {sources.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.06}>
                <EvidenceCard e={e} uses={m.features.filter((f) => f.source === e.id).map((f) => f.label)} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** On the product page: the way into this model's scientific research, technology and CFD page. */
export function DetailResearchLink({ id }: { id: ModelId }) {
  const m = modelById[id];
  const sources = evidence.filter((e) => m.research.includes(e.id)).length;
  return (
    <section aria-labelledby="research-link-title" className="bg-background py-16 md:py-20">
      <div className={wrap}>
        <Reveal>
          <Link
            href={`/scientific-research/${id}`}
            className="group grid gap-6 rounded-3xl border border-border bg-card p-6 transition-[border-color,box-shadow] duration-500 hover:border-brand-400 hover:shadow-[0_24px_40px_-28px_rgba(23,34,54,0.45)] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:p-8"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <FlaskConical className="size-6" aria-hidden="true" />
            </span>
            <span>
              <span className={type.eyebrow}>{m.name}</span>
              <span id="research-link-title" className={`mt-2 block ${type.h3} md:text-2xl`}>
                Scientific research
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {sources} {sources === 1 ? "source" : "sources"} from the Evidence Register
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-navy group-hover:text-brand-600 dark:group-hover:text-brand-300">
              View research
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/** Where this model sits in the four-model range, linking to the others. */
export function DetailRange({ id }: { id: ModelId }) {
  return (
    <section aria-labelledby="range-title" className="border-t border-border bg-background py-20 md:py-24">
      <div className={wrap}>
        <Reveal>
          <p className={type.eyebrow}>The AirGuard range</p>
          <h2 id="range-title" className={`mt-3 ${type.h2}`}>
            Four models
          </h2>
        </Reveal>
        <ol className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ladderOrder.map((mid, i) => {
            const m = modelById[mid];
            const current = mid === id;
            return (
              <li key={mid}>
                <Reveal delay={i * 0.06} className="h-full">
                  <Link
                    href={`/products/${mid}`}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "group flex h-full flex-col rounded-2xl border p-4 transition-[border-color,box-shadow] duration-500 md:p-5",
                      current ? "border-brand-500 shadow-[0_0_0_4px_rgba(64,103,177,0.12)]" : "border-border hover:border-navy/30"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">{m.code}</span>
                      {current ? (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 font-medium text-white">Viewing</span>
                      ) : (
                        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-navy" aria-hidden="true" />
                      )}
                    </div>
                    <div className="relative my-4 aspect-[16/10]">
                      <Image src={m.image} alt="" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-contain transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <span className="text-base font-medium tracking-tight text-navy">{m.name}</span>
                    <span className="text-sm text-muted-foreground">{m.role}</span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** Closing: price, Shop now and the purchase enquiry routes. */
export function DetailClosing({ id }: { id: ModelId }) {
  const m = modelById[id];
  const links = ["Request a quote", "Book a demo", "Check compatibility"];
  return (
    <section aria-labelledby="closing-title" className="relative overflow-hidden bg-[#0b1322] py-20 text-white md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_85%_30%,rgba(64,103,177,0.35),transparent_75%)]" />
      <div className={cn(wrap, "relative grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end")}>
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-brand-300">{m.name}</p>
          <h2 id="closing-title" className="mt-3 text-3xl font-medium tracking-tight md:text-5xl">
            Ready to Order?
          </h2>
          <p className="mt-3 text-sm text-white/70">To place an order, please call 877-412-3405.</p>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {links.map((l) => (
              <li key={l}>
                <Link href="/contact" className="group inline-flex items-center gap-1.5 text-white/75 hover:text-white">
                  {l}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
            <li>
              <a href={salesPhone.href} className="text-white/75 hover:text-white">
                {salesPhone.label}
              </a>
            </li>
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur md:p-8">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-white/50">Price</span>
            <span className="text-2xl font-medium tabular-nums">
              {m.price === null ? <span className="text-base font-normal text-white/60">On request</span> : formatUsd(m.price)}
            </span>
          </div>
          <AddToCart id={id} className="mt-5 w-full" />
        </Reveal>
      </div>
    </section>
  );
}

