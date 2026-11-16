"use client";

import { useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { productsMenu } from "@/data/products-menu";
import { arcaneHerbTeas, featuredArcaneHerbTeas } from "@/data/arcane-herb-products";
import aurora from "../../../public/images/site/king-hydrogen/aurora.webp";
import tumbler from "../../../public/images/site/arcane-herb/insulated-ceramic-tumbler-for-herbal-tea.webp";
import { useT } from "@/i18n/locale";

/*
 * King Hydrogen → Arcane Herb, as a relay: streams of light run behind the page from left to
 * right, drawn by the scroll. The main stream carries a bright pulse and passes through three
 * stops (King Hydrogen water → an Arcane Herb blend → prepared together); each stop arrives out
 * of focus and settles as the pulse reaches it. Two fainter streams run alongside, and small
 * branches lead off to the range sizes. Inspired by the GetLayers "Relay" template's single
 * stream of light running the length of the page.
 *
 * Pinned for ~2 screens (sticky). Stops sit exactly on the line: their positions are measured
 * from the SVG path. Phones get a serpentine layout. Reduced motion: drawn in full, not pinned.
 */

type Pt = { x: number; y: number };

const WATER = "#8cc8f0";
const HERB = "#a6d6b4";

type Layout = {
  vb: [number, number];
  main: string;
  side: string[];
  /** Each stop, near a point on the main stream; it snaps to the closest point of the path. */
  stops: [Pt, Pt, Pt];
  /** Cards hang below their stop (desktop) or beside it (phones). */
  cards: "below" | "beside";
  branches: { d: string; at: number; label: string; n: number; x: number; y: number }[];
};

const kingCount = productsMenu.find((c) => c.id === "king-hydrogen")?.items.length ?? 0;

const DESKTOP: Layout = {
  vb: [1200, 640],
  main: "M -20 360 C 90 360 130 330 230 330 C 360 330 400 230 560 230 C 720 230 760 400 930 400 C 1050 400 1100 330 1220 330",
  side: [
    "M -20 420 C 140 420 220 470 420 470 C 640 470 760 330 980 330 C 1100 330 1150 380 1220 380",
    "M -20 290 C 160 290 260 200 470 200 C 680 200 800 300 1000 280 C 1110 270 1160 250 1220 250",
  ],
  stops: [{ x: 230, y: 330 }, { x: 560, y: 230 }, { x: 930, y: 400 }],
  cards: "below",
  branches: [
    { d: "M 230 330 C 260 420 300 470 360 500", at: 0.22, label: "{n} King Hydrogen models", n: kingCount, x: 360, y: 500 },
    { d: "M 560 230 C 600 150 640 120 700 110", at: 0.52, label: "{n} Arcane Herb blends", n: arcaneHerbTeas.length, x: 700, y: 110 },
  ],
};

const PHONE: Layout = {
  vb: [400, 900],
  main: "M -20 50 C 20 60 40 100 44 130 C 50 200 360 160 360 250 C 360 330 44 300 44 370 C 44 440 360 410 360 490 C 360 570 44 540 44 610 C 44 690 300 700 420 780",
  side: [
    "M -20 260 C 80 300 360 330 340 470 C 320 600 60 560 80 700 C 90 790 300 860 420 880",
    "M -20 90 C 120 110 280 180 360 300 C 420 400 200 470 170 560 C 150 640 320 700 420 760",
  ],
  stops: [{ x: 44, y: 130 }, { x: 44, y: 370 }, { x: 44, y: 610 }],
  cards: "beside",
  branches: [],
};

export function RelayBridge() {
  const reduce = useMotionPreference();
  const tr = useT();
  const ref = useRef<HTMLElement>(null);
  const mainRef = useRef<SVGPathElement>(null);
  const [phone, setPhone] = useState(false);
  const [pts, setPts] = useState<{ pt: Pt; t: number }[] | null>(null);
  const [pulse, setPulse] = useState<Pt | null>(null);
  const L = phone ? PHONE : DESKTOP;

  useEffect(() => {
    const mq = matchMedia("(max-width: 767px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Stop positions, measured on the path so cards sit exactly on the stream.
  useEffect(() => {
    const p = mainRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    const samples = Array.from({ length: 400 }, (_, i) => {
      const q = p.getPointAtLength((i / 399) * len);
      return { pt: { x: q.x, y: q.y }, t: i / 399 };
    });
    setPts(L.stops.map((s) => samples.reduce((a, b) => (Math.hypot(b.pt.x - s.x, b.pt.y - s.y) < Math.hypot(a.pt.x - s.x, a.pt.y - s.y) ? b : a))));
  }, [L]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // The streams draw over the first 85% of the pin, then hold while the last stop settles.
  const draw = useTransform(scrollYProgress, [0.04, 0.82], [0, 1], { clamp: true });
  const drawSide = useTransform(scrollYProgress, [0, 0.9], [0, 1], { clamp: true });

  // The pulse rides the head of the main stream.
  useMotionValueEvent(draw, "change", (v) => {
    const p = mainRef.current;
    if (!p) return;
    setPulse(v > 0.002 && v < 0.998 ? p.getPointAtLength(v * p.getTotalLength()) : null);
  });

  const pct = (pt: Pt) => ({ left: `${(pt.x / L.vb[0]) * 100}%`, top: `${(pt.y / L.vb[1]) * 100}%` });
  const still = reduce;

  return (
    <section
      ref={ref}
      aria-labelledby="relay-title"
      id="relay"
      className={still ? "relative bg-[#0a1424]" : "relative h-[200svh] bg-[#0a1424] md:h-[260svh]"}
    >
      <div className={still ? "relative min-h-[100svh] overflow-hidden" : "sticky top-0 h-[100svh] overflow-hidden"}>
        {/* dot field */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,.14)_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000,transparent)]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_55%,rgba(140,200,240,.10),transparent_70%)]" />

        {/* heading */}
        <div className="relative z-10 mx-auto max-w-3xl px-5 pt-[calc(60px+2.5rem)] text-center md:pt-[calc(72px+3rem)]">
          <p className="text-xs font-medium text-white/55">{tr("Better together")}</p>
          <h2 id="relay-title" className="mt-2 text-[clamp(1.5rem,6vw,2.25rem)] font-medium tracking-tight text-white md:text-5xl">
            {tr("From")} <span style={{ color: WATER }}>{tr("water")}</span> {tr("to")} <span style={{ color: HERB }}>{tr("herbs")}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-white/65 md:text-base">
            {tr("Arcane Herb blends can be prepared with King Hydrogen water.")}
          </p>
        </div>

        {/* streams */}
        <div className="absolute inset-x-0 bottom-0 top-[28%] md:top-[22%]">
          <svg aria-hidden="true" viewBox={`0 0 ${L.vb[0]} ${L.vb[1]}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id="relay-grad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor={WATER} />
                <stop offset="1" stopColor={HERB} />
              </linearGradient>
              <linearGradient id="relay-grad-v" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={WATER} />
                <stop offset="1" stopColor={HERB} />
              </linearGradient>
            </defs>
            {L.side.map((d, i) => (
              <Stream key={`s${i}-${phone}`} d={d} progress={drawSide} still={still} width={1} opacity={0.22} grad={phone ? "relay-grad-v" : "relay-grad"} />
            ))}
            {L.branches.map((b) => (
              <Branch key={b.d} d={b.d} at={b.at} progress={draw} still={still} />
            ))}
            {/* glow under the main stream */}
            <Stream d={L.main} progress={draw} still={still} width={9} opacity={0.18} blur grad={phone ? "relay-grad-v" : "relay-grad"} />
            <Stream d={L.main} progress={draw} still={still} width={2} opacity={1} grad={phone ? "relay-grad-v" : "relay-grad"} pathRef={mainRef} />
          </svg>

          {/* the pulse at the head of the stream */}
          {pulse && !still && (
            <span aria-hidden="true" className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2" style={pct(pulse)}>
              <span className="block size-3 rounded-full bg-white shadow-[0_0_14px_4px_rgba(166,214,180,.8),0_0_40px_10px_rgba(140,200,240,.35)]" />
            </span>
          )}

          {/* branch labels */}
          {L.branches.map((b) => (
            <BranchLabel key={b.label} label={tr(b.label, { n: b.n })} at={b.at} progress={draw} still={still} style={pct(b)} />
          ))}

          {/* stops */}
          {pts && (
            <>
              <Stop
                at={pts[0].t}
                progress={draw}
                still={still}
                beside={L.cards === "beside"}
                style={pct(pts[0].pt)}
                accent={WATER}
                image={aurora}
                kicker="King Hydrogen"
                title={tr("Hydrogen water at home")}
                note={tr("Programmable hydrogen water")}
                href="/#hydrogen"
                cta={tr("See the range")}
              />
              <Stop
                at={pts[1].t}
                progress={draw}
                still={still}
                beside={L.cards === "beside"}
                style={pct(pts[1].pt)}
                accent={HERB}
                image={featuredArcaneHerbTeas[0]?.image}
                kicker="Arcane Herb"
                title={tr("Choose a blend")}
                note={tr("Small-batch botanical infusions")}
                href="/#herb"
                cta={tr("Browse blends")}
              />
              <Stop
                at={pts[2].t}
                progress={draw}
                still={still}
                beside={L.cards === "beside"}
                style={pct(pts[2].pt)}
                accent={HERB}
                image={tumbler}
                kicker={tr("Better together")}
                title={tr("Prepared together")}
                note={tr("Ask us which blend to pair with your King Hydrogen.")}
                href="/contact?product=king-hydrogen"
                cta={tr("Ask about pairing")}
                primary
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Stream({
  d,
  progress,
  still,
  width,
  opacity,
  grad,
  blur,
  pathRef,
}: {
  d: string;
  progress: MotionValue<number>;
  still: boolean;
  width: number;
  opacity: number;
  grad: string;
  blur?: boolean;
  pathRef?: React.Ref<SVGPathElement>;
}) {
  return (
    <motion.path
      ref={pathRef}
      d={d}
      fill="none"
      stroke={`url(#${grad})`}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity}
      style={{ pathLength: still ? 1 : progress, filter: blur ? "blur(6px)" : undefined }}
    />
  );
}

function Branch({ d, at, progress, still }: { d: string; at: number; progress: MotionValue<number>; still: boolean }) {
  const len = useTransform(progress, [at, at + 0.12], [0, 1], { clamp: true });
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="rgba(255,255,255,.35)"
      strokeWidth={1}
      strokeDasharray="0"
      style={{ pathLength: still ? 1 : len }}
    />
  );
}

function BranchLabel({
  label,
  at,
  progress,
  still,
  style,
}: {
  label: string;
  at: number;
  progress: MotionValue<number>;
  still: boolean;
  style: React.CSSProperties;
}) {
  const o = useTransform(progress, [at + 0.08, at + 0.14], [0, 1], { clamp: true });
  return (
    <motion.span
      style={{ ...style, opacity: still ? 1 : o }}
      className="absolute -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-[11px] text-white/70 backdrop-blur-sm"
    >
      {label}
    </motion.span>
  );
}

function Stop({
  at,
  progress,
  still,
  style,
  accent,
  image,
  kicker,
  title,
  note,
  href,
  cta,
  primary,
  beside,
}: {
  beside?: boolean;
  at: number;
  progress: MotionValue<number>;
  still: boolean;
  style: React.CSSProperties;
  accent: string;
  image?: StaticImageData;
  kicker: string;
  title: string;
  note: string;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  // arrives out of focus as the pulse nears, and settles once it passes
  const k = useTransform(progress, [at - 0.07, at + 0.01], [0, 1], { clamp: true });
  const opacity = useTransform(k, [0, 0.4, 1], [0, 0.6, 1]);
  const blur = useTransform(k, (v) => `blur(${((1 - v) * 10).toFixed(1)}px)`);
  const scale = useTransform(k, [0, 1], [1.08, 1]);
  const ring = useTransform(k, [0.9, 1], [0, 1]);
  // keep cards near the edges on screen: hang them toward the centre
  const x = parseFloat(String(style.left));
  const place = beside
    ? "left-6 top-0 -translate-y-1/2"
    : `left-0 top-4 ${x < 30 ? "-translate-x-[22%]" : x > 70 ? "-translate-x-[78%]" : "-translate-x-1/2"}`;
  return (
    <div className="absolute z-[2] size-0" style={style}>
      {/* the node on the line */}
      <motion.span
        aria-hidden="true"
        style={{ opacity: still ? 1 : ring, borderColor: accent, boxShadow: `0 0 18px ${accent}` }}
        className="absolute left-0 top-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[#0a1424]"
      />
      <motion.div
        style={still ? undefined : { opacity, filter: blur, scale }}
        className={`absolute ${place} w-[min(250px,calc(100vw-90px))] rounded-2xl border border-white/12 bg-[#0f1d33]/85 p-3 shadow-[0_24px_50px_-24px_rgba(0,0,0,.8)] backdrop-blur-md md:w-[250px]`}
      >
        <div className="flex items-center gap-3">
          {image && (
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#fff]/90">
              <Image src={image} alt="" fill sizes="48px" className="object-contain p-1" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-medium" style={{ color: accent }}>
              {kicker}
            </p>
            <p className="truncate text-sm font-medium text-white">{title}</p>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/60 max-md:hidden">{note}</p>
        <Link
          href={href}
          data-cta={primary ? "primary" : ""}
          className={
            primary
              ? "mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#fff] px-4 text-xs font-medium text-[#0a1424] hover:bg-[#e8f5ec]"
              : "mt-3 inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white"
          }
        >
          {cta}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  );
}
