"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import Image, { type StaticImageData } from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";
import { WHEEL_SPREAD, wheelGeometry } from "@/components/sections/hero-ring";
import { productsMenu } from "@/data/products-menu";
import { arcaneHerbTeas } from "@/data/arcane-herb-products";
import airguardImg from "../../../public/images/site/our-world/airguard.webp";
import kingHydrogenImg from "../../../public/images/site/our-world/king-hydrogen.webp";
import arcaneHerbImg from "../../../public/images/site/our-world/arcane-herb.webp";
import bookStoreImg from "../../../public/images/site/our-world/book-store.webp";

/*
 * "Our World": the four brands as expanding cards, adapted from the
 * cineframe ExpandingCardsSection. Hover, focus or tap opens a card; the
 * CTA jumps to that brand's section further down the page.
 */

type World = {
  /** Matches a column id in products-menu.ts. */
  menuId: string;
  categoryLabel: string;
  count: number;
  countLabel: string;
  summary: string;
  image: StaticImageData;
  /** Brand colour; dark enough to read on white. */
  accent: string;
  /** On-page section the CTA scrolls to. */
  href: string;
  cta: string;
};

const worldDetails: World[] = [
  {
    menuId: "airguard",
    categoryLabel: "Dental Protection",
    count: 4,
    countLabel: "Models",
    summary:
      "Extra-oral protection that attaches to your existing vacuum, keeping clinicians, staff and patients protected at the source.",
    image: airguardImg,
    accent: "#4067b1",
    href: "#airguard-3d",
    cta: "Explore AirGuard",
  },
  {
    menuId: "king-hydrogen",
    categoryLabel: "Hydrogen Wellness",
    count: 5,
    countLabel: "Editions",
    summary:
      "Distillation and hydrogen-water systems, from the practical SimpleStill to the full-spectrum Monarch.",
    image: kingHydrogenImg,
    accent: "#2b7fb8",
    href: "#aurora-3d",
    cta: "Explore King Hydrogen",
  },
  {
    menuId: "book-store",
    categoryLabel: "Knowledge & Research",
    count: 3,
    countLabel: "Titles",
    summary:
      "Books by Dr. James Orrington II on hydrogen water, health and building a better practice.",
    image: bookStoreImg,
    accent: "#a07a3c",
    href: "#book-store",
    cta: "Visit the Book Store",
  },
  {
    menuId: "arcane-herb",
    categoryLabel: "Natural Botanicals",
    count: arcaneHerbTeas.length,
    countLabel: "Blends",
    summary:
      "Whole-herb infusions rooted in traditional Chinese medicine, blended in small batches for sleep, detox, immunity and calm.",
    image: arcaneHerbImg,
    accent: "#4f8a62",
    href: "#arcane-herbs",
    cta: "Explore Arcane Herb",
  },
];

// Brand name, tagline and product list come from the products menu so they can't drift.
const worlds = worldDetails.map((w) => {
  const column = productsMenu.find((c) => c.id === w.menuId);
  const products = column?.items.map((i) => i.name) ?? [];
  return {
    ...w,
    brand: column?.brand ?? w.menuId,
    shortLabel: (column?.brand ?? w.menuId).replace("™", ""),
    tagline: column?.blurb ?? "",
    products,
    // Prefer the live product count where the menu lists every item.
    count: w.menuId === "arcane-herb" ? w.count : products.length || w.count,
  };
});

const smooth = (t: number) => {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};

/** Counts up to `to` on its own clock (not tied to scroll) whenever `run` turns on. */
function CountUp({ to, run }: { to: number; run: boolean }) {
  const value = useMotionValue(0);
  const shown = useTransform(value, (v) => Math.round(v));
  useEffect(() => {
    if (!run) {
      value.set(0);
      return;
    }
    const controls = animate(value, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [run, to, value]);
  return <motion.span className="tabular-nums">{shown}</motion.span>;
}

/** Scroll-driven entry for card `index` of four: it rises in from the wheel's tilt. */
function useCardEntry(show: MotionValue<number>, index: number, reduceMotion: boolean) {
  const own = useTransform(show, (v) => smooth(v * worlds.length - index));
  return {
    y: useTransform(own, (e) => (reduceMotion ? "0%" : `${((1 - e) * 105).toFixed(2)}%`)),
    rotate: useTransform(own, (e) => (reduceMotion ? 0 : (1 - e) * (index - 1.5) * 7)),
    opacity: useTransform(own, (e) => Math.min(1, e * 2.5)),
    imgScale: useTransform(own, (e) => (reduceMotion ? 1 : 1 + (1 - e) * 0.35)),
  };
}

/**
 * Embedded in a pinned frame (see our-world-stage.tsx), driven by its scroll progress:
 *  - `reveal` (0 → 1): opens through a circle, showing the "we deal in…" heading. With
 *    `opening="wheel"` the circle tracks the hero's spreading card wheel; with "center" it grows
 *    from nothing at the middle of the screen, like the other section hand-offs;
 *  - `show` (0 → 1): the heading clears and the four cards rise in one by one, all closed;
 *  - `tour` (0 → 1): only after that do the cards open, one at a time.
 */
export function OurWorld({
  reveal,
  show,
  tour,
  opening = "wheel",
}: {
  opening?: "wheel" | "center";
  reveal?: MotionValue<number>;
  show?: MotionValue<number>;
  tour?: MotionValue<number>;
}) {
  const [activeId, setActiveId] = useState(worlds[0].menuId); // AirGuard opens first
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const fullyOpen = useMotionValue(1);
  const progress = reveal ?? fullyOpen;
  const showProgress = show ?? fullyOpen;

  // Cards can't open until all four have come in.
  const [unlocked, setUnlocked] = useState(!show);
  useMotionValueEvent(showProgress, "change", (v) => {
    const next = v >= 1;
    if (next !== unlocked) {
      setUnlocked(next);
      setHoveredId(null);
    }
  });
  const expandedId = unlocked ? hoveredId ?? activeId : null;

  // Four cards, four entries (worlds is a fixed list).
  const entries = [
    useCardEntry(showProgress, 0, reduceMotion),
    useCardEntry(showProgress, 1, reduceMotion),
    useCardEntry(showProgress, 2, reduceMotion),
    useCardEntry(showProgress, 3, reduceMotion),
  ];

  // The counter in the heading starts once the heading is showing, and resets if you scroll back.
  const [counting, setCounting] = useState(!reveal);
  useMotionValueEvent(progress, "change", (v) => {
    if (v > 0.75 && !counting) setCounting(true);
    else if (v < 0.3 && counting) setCounting(false);
  });

  // The heading arrives as the circle opens and clears as the first card rises.
  const headingOpacity = useTransform([progress, showProgress], ([r, sh]: number[]) =>
    smooth((r - 0.55) / 0.35) * (1 - smooth((sh * worlds.length) / 0.7))
  );
  const headingY = useTransform(showProgress, (sh) => (reduceMotion ? 0 : -60 * smooth((sh * worlds.length) / 0.7)));
  const headingScale = useTransform(progress, (r) => (reduceMotion ? 1 : 0.9 + 0.1 * smooth((r - 0.5) / 0.5)));
  const clipPath = useTransform(progress, (v) => {
    if (v >= 1) return "none";
    // Closed (also the server render, so hydration matches).
    if (v <= 0 || typeof window === "undefined") return "circle(0px at 50% 50%)";
    if (opening === "center") return `circle(${(smooth(v) * 75).toFixed(2)}% at 50% 50%)`;
    // The opening fills the circle's hollow and spreads with it, then grows past the corners.
    const w = window.innerWidth;
    const h = window.innerHeight;
    const g = wheelGeometry(w, h);
    const withRing = g.inner * (1 + WHEEL_SPREAD * smooth(v)) * smooth(v / 0.8);
    const corner = Math.hypot(Math.max(g.cx, w - g.cx), Math.max(g.cy, h - g.cy)) * 1.02;
    const r = withRing + (corner - withRing) * smooth((v - 0.55) / 0.45);
    return `circle(${r.toFixed(1)}px at ${g.cx.toFixed(1)}px ${g.cy.toFixed(1)}px)`;
  });
  const pointerEvents = useTransform(progress, (v) => (v > 0.9 ? "auto" : "none"));
  // While Our World is pinned, scrolling opens each card in turn, a quarter of the stretch apiece.
  const tourValue = useMotionValue(0);
  useMotionValueEvent(tour ?? tourValue, "change", (v) => {
    const i = Math.min(worlds.length - 1, Math.max(0, Math.floor(v * worlds.length)));
    const id = worlds[i].menuId;
    if (id !== activeId) {
      setActiveId(id);
      setHoveredId(null); // scrolling takes over from a lingering hover
    }
  });

  return (
    <motion.section
      id="our-world"
      aria-label="Our World"
      style={reveal ? { clipPath, pointerEvents } : undefined}
      className={cn(
        "isolate overflow-hidden text-navy",
        reveal ? "absolute inset-0 z-30" : "relative scroll-mt-20"
      )}
    >
      {/* Same sky as the hero, so the hand-off reads as one continuous scene. */}
      <div aria-hidden className="hero-sky absolute inset-0 -z-10">
        <div className="hero-sky-grid" />
      </div>

      {/* First thing out of the circle: what the family of brands is about. */}
      <motion.div
        style={{ opacity: headingOpacity, y: headingY, scale: headingScale }}
        className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 pt-[72px] text-center"
      >
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4067b1]/15 bg-white/70 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4067b1] backdrop-blur-md">
          Our World · {worlds.length} Brands
        </span>
        <h2 className="max-w-[18ch] text-[clamp(2rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-tight text-navy">
          We deal in{" "}
          <span className="inline-block min-w-[0.7em] font-bold text-[#4067b1]">
            <CountUp to={worlds.length} run={counting} />
          </span>{" "}
          product categories of{" "}
          <span className="bg-[linear-gradient(90deg,#4067b1_0%,#5b80c8_100%)] bg-clip-text font-bold text-transparent">
            Health &amp; Wellness
          </span>
        </h2>
        <p className="mt-5 max-w-md text-base text-navy/60 sm:text-lg">
          Dental protection, hydrogen wellness, books and botanicals. Scroll to meet each one.
        </p>
      </motion.div>

      {/* Full-bleed: the four cards fill the viewport edge to edge with no gaps.
          They rise in one by one as you scroll, photos settling from a zoom. */}
          <div
            className="relative flex h-[100svh] w-full flex-col pt-[72px] md:flex-row md:pt-0" // phones: stack starts below the 72px navbar
            onMouseLeave={() => setHoveredId(null)}
          >
            {worlds.map((world, index) => {
              const isExpanded = expandedId === world.menuId;

              return (
                <motion.div
                  key={world.menuId}
                  style={{
                    y: entries[index].y,
                    rotate: entries[index].rotate,
                    opacity: entries[index].opacity,
                  }}
                  role="button"
                  tabIndex={unlocked ? 0 : -1}
                  aria-expanded={isExpanded}
                  aria-label={`${world.brand}: ${world.categoryLabel}`}
                  onMouseEnter={() => unlocked && setHoveredId(world.menuId)}
                  onFocus={() => unlocked && setActiveId(world.menuId)}
                  onClick={() => unlocked && setActiveId(world.menuId)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget || !unlocked) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (isExpanded) window.location.hash = world.href;
                      else setActiveId(world.menuId);
                    }
                  }}
                  className={cn(
                    "group relative min-h-[64px] cursor-pointer select-none overflow-hidden outline-none transition-[flex-grow,min-width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4067b1] motion-reduce:transition-none",
                    isExpanded
                      ? "flex-[4] sm:flex-[3.5] md:min-w-[300px] lg:flex-[3.2]"
                      : "flex-1 md:min-w-[88px]"
                  )}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ scale: entries[index].imgScale }}
                  >
                  <Image
                    src={world.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 60vw, 100vw"
                    placeholder="blur"
                    className={cn(
                      "object-cover transition-transform duration-700 ease-out motion-reduce:transition-none",
                      isExpanded ? "scale-105" : "scale-100"
                    )}
                  />
                  </motion.div>

                  <div
                    className={cn(
                      "absolute inset-0 transition-opacity duration-500",
                      isExpanded
                        ? "bg-transparent"
                        : "bg-gradient-to-t from-white/35 to-transparent to-40%"
                    )}
                  />

                  <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-2">
                    <span className={cn("rounded-md border border-navy/10 bg-white/85 px-2.5 py-1 font-mono text-[11px] tracking-wider text-navy/80 backdrop-blur-md", !isExpanded && "max-md:hidden" /* phones: closed cards are too short for it */)}>
                      0{index + 1}
                    </span>
                    {isExpanded && (
                      <span
                        className="truncate rounded-md border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md"
                        style={{ color: world.accent, borderColor: `${world.accent}55`, backgroundColor: "rgba(255,255,255,0.92)" }}
                      >
                        {world.categoryLabel}
                      </span>
                    )}
                  </div>

                  {/* Collapsed: the name sits flat along the bottom over a soft shade, like a photo caption. */}
                  {!isExpanded && (
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0f1a2e]/85 via-[#0f1a2e]/45 to-transparent p-4 pt-14 md:p-5 md:pt-28">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: world.accent, boxShadow: `0 0 8px ${world.accent}` }}
                        />
                        <span className="truncate">{world.categoryLabel}</span>
                      </p>
                      <div className="mt-1.5 flex items-end justify-between gap-2">
                        <h3 className="text-lg font-semibold leading-tight tracking-tight text-white md:text-xl">
                          {world.shortLabel}
                        </h3>
                        <ArrowUpRight className="mb-0.5 size-4 shrink-0 text-white/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                      </div>
                    </div>
                  )}

                  {/* Open: the same navy shade as the closed captions (no white fade), text in white,
                      so it reads the same over every photo and in both themes. */}
                  {isExpanded && (
                    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end bg-gradient-to-t from-[#0f1a2e]/92 via-[#0f1a2e]/60 via-60% to-transparent p-5 pt-20 text-white sm:p-7 sm:pt-24 lg:p-8 lg:pt-32">
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-white/80">
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: world.accent, boxShadow: `0 0 8px ${world.accent}` }}
                        />
                        {world.tagline}
                      </p>

                      <div className="flex items-end justify-between gap-4 border-b border-white/20 pb-4">
                        <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                          {world.brand}
                        </h3>
                        <div className="relative flex shrink-0 items-center gap-3 pl-3">
                          <div aria-hidden="true" className="-mr-1 h-12 w-[1.5px] rotate-[28deg] bg-gradient-to-b from-white/10 via-white/50 to-white/10" />
                          <div className="text-right">
                            <div className="font-mono text-2xl font-black leading-none tracking-tight text-white tabular-nums sm:text-3xl lg:text-4xl">
                              {world.count}
                            </div>
                            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/65 sm:text-xs">
                              {world.countLabel}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-white/80 sm:line-clamp-2 sm:text-sm">
                        {world.summary}
                      </p>

                      <ul className="mt-4 hidden flex-wrap gap-1.5 sm:flex" aria-label={`${world.brand} products`}>
                        {world.products.map((name) => (
                          <li
                            key={name}
                            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur-sm"
                          >
                            {name}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-white/60">{world.categoryLabel}</span>
                        <a
                          href={world.href}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                          style={{ backgroundColor: world.accent }}
                        >
                          {world.cta}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
    </motion.section>
  );
}
