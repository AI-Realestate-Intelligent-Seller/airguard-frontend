"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { motion, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import type { SVGProps } from "react";
import { ArrowUpRight, Box, Landmark, Layers, Leaf, ShieldCheck, Stethoscope, Users, type LucideIcon } from "lucide-react";
import { Section } from "@/components/layout/section";
import { BOOK_STORE_URL } from "@/data/book-store";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { RAIL_ATTR, UNCOIL_SPEED, uncoilPath } from "@/lib/uncoil-path";
// Artwork cropped from the approved design, "The Journey_ Find Your Path.png".
import founderPortrait from "../../../public/images/site/journey/dr-james-operatory.webp";
import dentalImg from "../../../public/images/site/journey/dental.webp";
import wellnessImg from "../../../public/images/site/journey/wellness.webp";
import clinicImg from "../../../public/images/site/journey/institutional.webp";
import productImg from "../../../public/images/site/journey/distributors.webp";
import researchImg from "../../../public/images/site/journey/partners.webp";

/*
 * "The Journey": scrolls up from below the hero while the hero's ring swirls down its drain; the
 * stream comes out of this section's top edge and five cards open out into its rows, one by one.
 * Dr. James Orrington II fills the left half; on the right, "Find your path" lays out the
 * buyer pathways from the site brief. Once it has opened, the audiences play in by themselves,
 * one after another: a numbered node on the rail, use-case pills linking to the most relevant place, a
 * contextual photo, and the audience's conversion button. Credentials run along the bottom.
 * Small screens skip the pin: cards arrive as they scroll into view.
 */

/** Tooth, drawn to match the lucide line icons (lucide has none). */
function ToothIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.5 3C5 3 3 5 3 7.6c0 2 .8 3.3 1.4 4.8.7 1.7.6 4.2 1 6.2.3 1.5 1 2.4 1.9 2.4 1.5 0 1.6-3 2.4-4.9.4-.9 1.1-1.3 2.3-1.3s1.9.4 2.3 1.3c.8 1.9.9 4.9 2.4 4.9.9 0 1.6-.9 1.9-2.4.4-2 .3-4.5 1-6.2.6-1.5 1.4-2.8 1.4-4.8C21 5 19 3 16.5 3c-1.9 0-2.9 1.1-4.5 1.1S9.4 3 7.5 3Z" />
    </svg>
  );
}

/** Where a buyer goes next: a product section on this page, or the contact form. */
const CONTACT = "/contact#contact-form";
/* Every pill and call to action goes to a real page: the product pages, research, about or the
   live book store where one exists, otherwise the contact form. */

type Step = {
  audience: string;
  icon: LucideIcon | typeof ToothIcon;
  line: string;
  /** Use cases this audience comes for, each linking to the most relevant place. */
  pills: { label: string; href: string }[];
  image: StaticImageData;
  /** Accent, plus a lighter tint for the glossy node and button gradients. */
  accent: string;
  tint: string;
  /** The conversion action for this audience. */
  cta: { label: string; href: string };
};

const steps: Step[] = [
  {
    audience: "Dental practices",
    icon: ToothIcon,
    line: "Chairside protection that fits the vacuum you already have.",
    pills: [
      { label: "Hygiene & scaling", href: "/products#compare" },
      { label: "High-speed handpiece work", href: "/products" },
      { label: "Compact operatories", href: "/products/ch" },
    ],
    image: dentalImg,
    accent: "#1d4f9c",
    tint: "#4f86d8",
    cta: { label: "Find your AirGuard", href: "/products" },
  },
  {
    audience: "Wellness & home",
    icon: Leaf,
    line: "Hydrogen water, botanical blends and books for everyday wellbeing.",
    pills: [
      { label: "Hydrogen water at home", href: CONTACT },
      { label: "Sleep & calm", href: CONTACT },
      { label: "Detox & immunity", href: CONTACT },
      { label: "Books on wellbeing", href: BOOK_STORE_URL },
    ],
    image: wellnessImg,
    accent: "#2f7a3b",
    tint: "#5cae64",
    cta: { label: "Shop wellness", href: CONTACT },
  },
  {
    audience: "Institutional buyers",
    icon: Landmark,
    line: "Equip every operatory across a group, school or clinic network.",
    pills: [
      { label: "Group practices", href: "/products/xp" },
      { label: "Dental schools", href: "/products/xp" },
      { label: "Clinics & hospitals", href: CONTACT },
    ],
    image: clinicImg,
    accent: "#1a5fa6",
    tint: "#4b93dc",
    cta: { label: "Request a quote", href: CONTACT },
  },
  {
    audience: "Distributors",
    icon: Box,
    line: "Carry AirGuard, King Hydrogen and Arcane Herb in your market.",
    pills: [
      { label: "Dental supply", href: CONTACT },
      { label: "Wellness retail", href: CONTACT },
      { label: "New territories", href: CONTACT },
    ],
    image: productImg,
    accent: "#9a6a22",
    tint: "#cf9a45",
    cta: { label: "Become a distributor", href: CONTACT },
  },
  {
    audience: "Partners",
    icon: Users,
    line: "Research, associations and media working with the family of brands.",
    pills: [
      { label: "Clinical research", href: "/research" },
      { label: "Associations & events", href: "/about" },
      { label: "Media & publishing", href: BOOK_STORE_URL },
    ],
    image: researchImg,
    accent: "#5b36a8",
    tint: "#8d6ad8",
    cta: { label: "Partner with us", href: CONTACT },
  },
];

const proof = [
  { icon: Stethoscope, label: "Designed by a practicing dentist" },
  { icon: Layers, label: "Patented designs with Beyond Design, Inc." },
  { icon: ShieldCheck, label: "FDA registered" },
];

const EASE = [0.16, 1, 0.3, 1] as const;
/*
 * Scroll (desktop), in screens (svh):
 *   -100 –   0  the Journey scrolls up from below as the hero lets go; the hero's ring swirls
 *               down its drain and the stream comes out of this section's top edge
 *      0 – 100  pinned: the stream runs down beside the numbers, its cards opening out one by one
 *    100 – 200  the finished view holds
 *    200 – 300  Our World opens through a growing circle over the Journey, which dims beneath it
 */
const PINNED_SVH = 300; // keep in step with the track height (PINNED_SVH + 100)
/** Hand-off to Our World, which pins over this frame and opens through a circle. */
const COVER = [200 / PINNED_SVH, 1] as const;
/** Seconds between one card and the next as they play in (phones / reduced motion). */
const STAGGER = 0.22;
const CARD_IN = 0.8;

/* The stream (desktop). Above, the hero's ring breaks open at 9 o'clock and uncoils in step with
   the scroll: its strip runs down the left, takes a small curve just above the hero's bottom edge
   and crosses it right on the line of this section's numbered rail (the path is shared:
   lib/uncoil-path.ts). Here the strip carries straight on down the rail at the same size, spacing
   and speed; five cards make it, and as each reaches its row it opens out into its card, one by
   one. Driven by scroll, in this frame's own coordinates, so scrolling back runs it in reverse. */
const HEAD = 5; // cards in the stream, one per row
/** How far the stream runs (px) while a card opens out into its row. */
const PEEL_RUN = 300;
/** Card size on the rail (px): across its path, and along it. */
const RAIL_CARD = { across: 64, along: 46 };
/** How far below the edge (px) the cards slim down from ring size to rail size. */
const SLIM_RUN = 160;
/** Hidden run-up above the top edge (px), so cards come out over the edge rather than appear. */
const RUN_UP = 400;
/** Hero ring numbers (hero-ring.tsx): card count and inner-rim spacing. */
const RING_COUNT = 33;
const WHEEL_GAP = 1.02;

/** For the hero's glide: the Journey's track, and how far into it (screens) the cards have landed. */
export const JOURNEY_TRACK_ID = "journey-track";
export const JOURNEY_LANDED_SCREENS = 1;

type Stream = {
  railX: number;
  /** Each row's stop along the rail (px from the run-up start) and the end of the run. */
  stations: number[];
  end: number;
  /** Row boxes, in frame coordinates. */
  slots: { x: number; y: number; w: number; h: number }[];
  /** The hero's strip: card size, spacing, speed (px per screen), and its run from break to edge. */
  card: { across: number; along: number };
  spacing: number;
  speed: number;
  lead: number;
};

const smooth = (t: number) => {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function planStream(frame: HTMLElement | null, rail: HTMLElement | null, slotEls: (HTMLElement | null)[]): Stream | null {
  if (!frame || !rail || slotEls.some((el) => !el)) return null;
  const f = frame.getBoundingClientRect();
  const slots = slotEls.map((el) => {
    const b = el!.getBoundingClientRect();
    return { x: b.left - f.left, y: b.top - f.top, w: b.width, h: b.height };
  });
  const r = rail.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const vh = window.innerHeight;
  const { g, mid, toEdge } = uncoilPath(window.innerWidth, vh, x);
  const stream: Stream = {
    railX: x - f.left,
    stations: slots.map((b) => RUN_UP + b.y + b.h / 2),
    end: 0,
    slots,
    card: { across: g.outer - g.inner, along: (2 * Math.PI * g.inner) / RING_COUNT / WHEEL_GAP },
    spacing: (2 * Math.PI * mid) / RING_COUNT,
    speed: UNCOIL_SPEED * vh,
    lead: toEdge,
  };
  stream.end = landedAt(stream, HEAD - 1) + 140; // runs on until the last card has faded into its row
  return stream;
}

/** Head position at which card `i` reaches its row / has opened out into it. */
const peelAt = (stream: Stream, i: number) => stream.stations[i] + i * stream.spacing;
const landedAt = (stream: Stream, i: number) => peelAt(stream, i) + PEEL_RUN;

/** How far the head of the stream has run, for `t` screens into the hand-off (0 → 2). */
function headAt(stream: Stream, t: number) {
  // In step with the hero's strip: the card that was at the break crosses the edge (RUN_UP) once
  // the strip has run `lead`. On a short screen it may not have finished by the end of the second
  // screen, so it is eased home over the last half screen.
  const synced = (tt: number) => RUN_UP + tt * stream.speed - stream.lead;
  const short = Math.max(0, stream.end - synced(2));
  return synced(Math.min(t, 2)) + short * smooth((t - 1.5) / 0.5);
}

/** Where stream card `card` is, in frame coordinates. */
function cardAt(stream: Stream, card: number, t: number) {
  const head = headAt(stream, t);
  const own = head - card * stream.spacing;
  const y = own - RUN_UP; // straight down the rail from the top edge
  const m = smooth(y / SLIM_RUN);
  let c = {
    cx: stream.railX,
    cy: y,
    across: lerp(stream.card.across, RAIL_CARD.across, m),
    along: lerp(stream.card.along, RAIL_CARD.along, m),
    settle: 0,
  };
  if (own > stream.stations[card]) {
    // Leaving the stream at its row: off the rail and open into the card.
    const slot = stream.slots[card];
    const e = smooth((head - peelAt(stream, card)) / PEEL_RUN);
    const fromY = stream.stations[card] - RUN_UP;
    c = {
      cx: lerp(stream.railX, slot.x + slot.w / 2, e),
      cy: lerp(fromY, slot.y + slot.h / 2, e),
      across: lerp(RAIL_CARD.across, slot.w, e),
      along: lerp(RAIL_CARD.along, slot.h, e),
      settle: e,
    };
  }
  return {
    x: c.cx - c.across / 2,
    y: c.cy - c.along / 2,
    width: c.across,
    height: c.along,
    rotate: 0,
    settle: c.settle,
    opacity: 1 - smooth((head - landedAt(stream, card)) / 120), // hands over to the real card
  };
}

/** One card of the stream, carrying its audience. */
function StreamCard({ stream, card, t }: { stream: Stream; card: number; t: MotionValue<number> }) {
  const step = steps[card];
  const x = useTransform(t, (v) => cardAt(stream, card, v).x);
  const y = useTransform(t, (v) => cardAt(stream, card, v).y);
  const width = useTransform(t, (v) => cardAt(stream, card, v).width);
  const height = useTransform(t, (v) => cardAt(stream, card, v).height);
  const rotate = useTransform(t, (v) => cardAt(stream, card, v).rotate);
  const opacity = useTransform(t, (v) => cardAt(stream, card, v).opacity);
  const borderRadius = useTransform(t, (v) => 8 + 8 * cardAt(stream, card, v).settle);
  const labelOpacity = useTransform(t, (v) => smooth((cardAt(stream, card, v).settle - 0.6) / 0.4));
  return (
    <motion.div
      className="absolute left-0 top-0 overflow-hidden border border-white/70 shadow-[0_18px_40px_-18px_rgba(10,18,34,0.6)]"
      style={{ x, y, width, height, rotate, opacity, borderRadius, zIndex: HEAD - card }}
    >
      <Image src={step.image} alt="" fill sizes="640px" className="object-cover" />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `linear-gradient(140deg, ${step.accent}e6 0%, ${step.accent}99 45%, ${step.tint}33 100%)` }}
      />
      <motion.span
        className="absolute bottom-3 left-4 whitespace-nowrap font-serif text-xl leading-none text-white"
        style={{ opacity: labelOpacity }}
      >
        {step.audience}
      </motion.span>
    </motion.div>
  );
}

/** The stream, inside the Journey frame (clipped by it), on the page's scroll. */
function StreamRide({
  stream,
  track,
  onLanded,
}: {
  stream: Stream;
  track: React.RefObject<HTMLDivElement | null>;
  onLanded: (count: number) => void;
}) {
  const { scrollY } = useScroll();
  // Screens into the hand-off: 0 as the hero lets go (the Journey's top at the bottom of the
  // screen), 1 as the Journey pins, 2 a screen later. Read live, so late layout shifts don't matter.
  const t = useTransform(scrollY, () => {
    const el = track.current;
    if (!el) return 0;
    const vh = window.innerHeight;
    return Math.max(0, Math.min(2, 1 - el.getBoundingClientRect().top / vh));
  });
  const landed = useRef(-1);
  const report = (v: number) => {
    const head = headAt(stream, v);
    let n = 0;
    while (n < HEAD && head >= landedAt(stream, n)) n++;
    if (n !== landed.current) {
      landed.current = n;
      onLanded(n);
    }
  };
  useMotionValueEvent(t, "change", report);
  useEffect(() => report(t.get()));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {steps.map((s, card) => (
        <StreamCard key={s.audience} stream={stream} card={card} t={t} />
      ))}
    </div>
  );
}

/*
 * Short desktop screens (laptops): classes prefixed lg:[@media(max-height:820px)]: tighten
 * the layout so all five cards fit while pinned. Written out in full so Tailwind finds them.
 */

function StepCard({
  step,
  index,
  pinned,
  pinnedPlay,
  flown,
  landed,
  bodyRef,
}: {
  step: Step;
  index: number;
  pinned: boolean;
  /** Pinned (desktop): true once the Journey has arrived; every card then plays in on its own delay. */
  pinnedPlay: boolean;
  /** Arrives by the card train from the hero's wheel: the card shows as its car pulls in. */
  flown: boolean;
  /** Its car from the train has settled into the slot. */
  landed: boolean;
  /** The card's slot, measured to lay the train's track. */
  bodyRef: (el: HTMLDivElement | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const Icon = step.icon;
  // Phones: each card plays in as it scrolls into view.
  const ref = useRef<HTMLLIElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const on = pinned ? (flown ? landed : pinnedPlay) : seen;
  const delay = flown ? 0 : pinned && !reduceMotion ? index * STAGGER : 0;

  return (
    <li ref={ref} className="relative flex items-center gap-3 sm:gap-4">
      {/* Glossy numbered node on the rail */}
      <span
        className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full font-semibold tabular-nums text-white ring-[3px] ring-white transition-[opacity,box-shadow,filter] duration-500 dark:ring-[#16223a]"
        style={{
          backgroundImage: `radial-gradient(circle at 32% 28%, ${step.tint} 0%, ${step.accent} 62%, ${step.accent} 100%)`,
          boxShadow: on
            ? `0 0 0 6px ${step.accent}1f, 0 8px 22px -6px ${step.accent}aa, inset 0 1px 1px #ffffff80`
            : "inset 0 1px 1px #ffffff60",
          opacity: on ? 1 : 0.45,
          filter: on ? "none" : "saturate(0.4)",
          // Lights up as its card lands
          transitionDelay: on ? `${Math.round((delay + (flown ? 0 : CARD_IN * 0.4)) * 1000)}ms` : "0ms",
        }}
      >
        0{index + 1}
      </span>

      <motion.div
        ref={bodyRef}
        initial={reduceMotion || flown ? { opacity: 0 } : { opacity: 0, x: 60, scale: 0.95 }}
        animate={on ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0 }}
        transition={on ? { duration: reduceMotion ? 0.3 : flown ? 0.3 : CARD_IN, delay, ease: EASE } : { duration: 0.2 }}
        className="relative isolate min-w-0 flex-1 origin-left overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_14px_40px_-26px_rgba(23,34,54,0.45),inset_0_1px_0_#ffffff] backdrop-blur-md dark:border-white/10"
      >
        {/* Contextual photo, fading in from the right behind the button */}
        <div className="pointer-events-none absolute inset-y-0 right-[176px] -z-10 hidden w-[22%] sm:block">
          <Image
            src={step.image}
            alt=""
            fill
            sizes="240px"
            placeholder="blur"
            className="object-cover [mask-image:linear-gradient(90deg,transparent_0%,black_40%,black_88%,transparent_100%)]"
          />
        </div>

        <div className={`grid items-center gap-3 p-3.5 sm:grid-cols-[1fr_auto] sm:gap-4 sm:p-4 lg:[@media(max-height:820px)]:py-2.5`}>
          <div className="flex min-w-0 gap-3">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-white shadow-[0_6px_16px_-8px_rgba(23,34,54,0.45),inset_0_1px_0_#ffffff] dark:border-white/10"
              style={{ color: step.accent, backgroundImage: `linear-gradient(180deg, #ffffff 0%, ${step.tint}33 100%)` }}
            >
              <Icon className="size-[22px]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h3 className={`font-serif text-2xl leading-none text-navy not-italic sm:text-[28px] lg:[@media(max-height:820px)]:text-[22px]`}>
                {step.audience}
              </h3>
              <p className={`mt-1 line-clamp-1 text-[13px] text-navy/70 lg:[@media(max-height:820px)]:hidden`}>{step.line}</p>
              <ul className="mt-2 flex flex-wrap gap-1" aria-label={`${step.audience} use cases`}>
                {step.pills.map((pill) => (
                  <li key={pill.label}>
                    <Link
                      href={pill.href}
                      className="inline-flex whitespace-nowrap rounded-full border border-white bg-white/85 px-2 py-[3px] text-[10.5px] font-medium text-navy/85 shadow-[0_2px_8px_-4px_rgba(23,34,54,0.35)] transition-colors hover:border-[var(--pill)] hover:text-[var(--pill)] dark:border-white/10"
                      style={{ "--pill": step.accent } as CSSProperties}
                    >
                      {pill.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The conversion action for this audience */}
          <Link
            href={step.cta.href}
            className="group inline-flex min-w-[164px] items-center justify-center gap-1.5 justify-self-start whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold text-white transition-[transform,filter] hover:scale-[1.03] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cta)] sm:justify-self-end"
            style={
              {
                "--cta": step.accent,
                backgroundImage: `linear-gradient(180deg, ${step.tint} -40%, ${step.accent} 70%)`,
                boxShadow: `0 10px 24px -10px ${step.accent}, inset 0 1px 0 #ffffff40`,
              } as CSSProperties
            }
          >
            {step.cta.label}
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </li>
  );
}

export function FamilyStory() {
  const reduceMotion = useReducedMotion();
  const pinned = useIsDesktop();
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  // Desktop: the cards arrive by the snake from the hero's ring (unless motion is reduced).
  const flown = pinned && !reduceMotion;
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<Stream | null>(null);
  const [landed, setLanded] = useState(0);
  // Lay the stream's path once the frame has laid out, and again whenever it changes size.
  useEffect(() => {
    if (!flown) return;
    let raf = 0;
    const plan = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setStream(planStream(frameRef.current, railRef.current, slotRefs.current))
      );
    };
    plan();
    document.fonts?.ready.then(plan); // web fonts can shift the rows once they arrive
    window.addEventListener("resize", plan);
    const ro = new ResizeObserver(plan);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", plan);
    };
  }, [flown]);
  // Phones and reduced motion: the cards play in once the Journey reaches the top.
  const [playCards, setPlayCards] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!playCards && v > 0.002) setPlayCards(true);
  });
  const coverDim = useTransform(scrollYProgress, [...COVER], [0, 0.55]);

  return (
    // Follows the hero: it scrolls up from below as the hero lets go, then pins (desktop).
    <div id={JOURNEY_TRACK_ID} ref={trackRef} className="relative z-20 lg:h-[400svh]">
      <motion.div ref={frameRef} className="lg:sticky lg:top-0 lg:h-[100svh]">
        <Section
          id="journey"
          theme="white"
          aria-labelledby="journey-title"
          className="grid overflow-hidden p-0 md:p-0 lg:h-full lg:grid-cols-[0.7fr_1fr] lg:py-0"
        >
          {/* ── Left: the founder, full height, with the story over the photo ── */}
          <div className="relative isolate flex min-h-[92svh] flex-col justify-end overflow-hidden bg-[linear-gradient(180deg,#0a1e3c_0%,#061224_60%)] text-white lg:min-h-0">
            {/* Dr. James in the operatory, across the top below the 72px navbar, fading into the navy */}
            <motion.div
              className="absolute inset-x-0 top-[72px] -z-10 aspect-[695/340] overflow-hidden lg:aspect-auto lg:h-[48%]"
              initial={reduceMotion ? false : { scale: 1.1 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.6, ease: EASE }}
            >
              <Image
                src={founderPortrait}
                alt="Dr. James Orrington II, DDS"
                fill
                sizes="(min-width: 1024px) 41vw, 100vw"
                placeholder="blur"
                className="object-cover object-[70%_25%]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,#061224_0%,#06122400_45%)]" />
            </motion.div>
            {/* Deep-navy grade: from the bottom for the story, and a cool blue cast over the photo */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#061224_0%,#061224f2_30%,#0a1d3dcc_52%,#0b234a33_75%,transparent_100%)]" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_0%_100%,#0b2a5c99,transparent_60%)] mix-blend-screen" />

            {/* Light swoosh along the bottom */}
            <svg
              aria-hidden="true"
              viewBox="0 0 600 220"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[38%] w-full"
            >
              <defs>
                <linearGradient id="journey-swoosh" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0" />
                  <stop offset="45%" stopColor="#6fa8ff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#b9d6ff" stopOpacity="0.2" />
                </linearGradient>
                <filter id="journey-glow" x="-10%" y="-50%" width="120%" height="200%">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>
              <path d="M-20 200 C 160 190, 330 150, 620 40" fill="none" stroke="url(#journey-swoosh)" strokeWidth="6" filter="url(#journey-glow)" />
              <path d="M-20 200 C 160 190, 330 150, 620 40" fill="none" stroke="url(#journey-swoosh)" strokeWidth="1.5" />
              <path d="M-20 214 C 200 205, 360 175, 620 90" fill="none" stroke="url(#journey-swoosh)" strokeWidth="1" opacity="0.6" />
              <path d="M-20 225 C 220 218, 400 196, 620 140" fill="none" stroke="url(#journey-swoosh)" strokeWidth="0.75" opacity="0.4" />
            </svg>

            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
              className={`p-6 pt-48 md:p-10 lg:p-12 lg:[@media(max-height:820px)]:py-8`}
            >
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#9dc0ff]">
                The Journey
                <span aria-hidden="true" className="h-px w-12 bg-[#9dc0ff]/70" />
              </p>
              <h2
                id="journey-title"
                className={`mt-4 font-serif text-[clamp(2.75rem,4.6vw,4.5rem)] leading-[0.95] tracking-tight not-italic lg:[@media(max-height:820px)]:text-5xl`}
              >
                <span className="bg-[linear-gradient(180deg,#ffffff_40%,#c9dcff)] bg-clip-text text-transparent">
                  It started in the dental chair.
                </span>
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-[1.7] text-white/80">
                Chairside every day, Dr. James Orrington II, DDS, kept returning to one question: what are we
                really breathing? That question led to AirGuard, and later inspired a family of health-focused
                brands.
              </p>

              <figure className={`mt-6 max-w-md lg:[@media(max-height:820px)]:mt-4`}>
                <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] p-5 pl-16 shadow-[0_20px_40px_-24px_#000,inset_0_1px_0_#ffffff1f] backdrop-blur-md">
                  <span aria-hidden="true" className="absolute left-5 top-3 font-serif text-6xl leading-none text-[#8fb3ef]">
                    “
                  </span>
                  <blockquote className="font-serif text-xl italic leading-snug text-white/90">
                    The AirGuard™ is a game changer when using a cavitron or a high-speed handpiece.
                  </blockquote>
                </div>
                <figcaption className={`mt-5 lg:[@media(max-height:820px)]:mt-3`}>
                  <div className="border-l-2 border-[#4f8ef7] pl-3">
                    <p className="font-semibold">Dr. James Orrington II, DDS</p>
                    <p className="text-sm text-white/65">Founder · Dentist · Inventor</p>
                  </div>
                  <a
                    href="/about"
                    className={`mt-5 inline-flex items-center gap-2 rounded-full bg-[#ffffff] px-6 py-2.5 text-sm font-semibold text-[#172236] shadow-[0_10px_30px_-12px_#000] transition-transform hover:scale-[1.03] lg:[@media(max-height:820px)]:mt-3`}
                  >
                    His story <ArrowUpRight className="size-4" />
                  </a>
                </figcaption>
              </figure>
            </motion.div>
          </div>

          {/* ── Right: Find your path ── */}
          <div
            className={`flex min-h-0 flex-col gap-4 bg-[radial-gradient(90%_60%_at_80%_0%,#ffffff,transparent),linear-gradient(160deg,#f4f7fc_0%,#e7eef9_55%,#eef1f8_100%)] px-4 pb-6 pt-10 sm:px-8 lg:px-8 lg:pb-5 lg:pt-[88px] dark:bg-[radial-gradient(90%_60%_at_80%_0%,#16264a,transparent),linear-gradient(160deg,#0c1528_0%,#0f1c36_55%,#0b1424_100%)] lg:[@media(max-height:820px)]:gap-3 lg:[@media(max-height:820px)]:pt-[80px]`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-7">
              <h3 className={`relative w-fit shrink-0 font-serif text-5xl leading-none text-navy not-italic lg:[@media(max-height:820px)]:text-4xl`}>
                Find your path
                <svg aria-hidden="true" viewBox="0 0 300 16" className="absolute -bottom-3 left-[30%] h-3 w-[72%]" preserveAspectRatio="none">
                  <path d="M2 12 C 80 2, 200 2, 298 8" fill="none" stroke="#3f74c9" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </h3>
              <span aria-hidden="true" className="hidden h-12 w-px bg-navy/15 md:block" />
              <p className="max-w-sm text-sm leading-relaxed text-navy/70">
                Explore how AirGuard and our family of brands support your practice, your wellbeing and your mission.
              </p>
            </div>

            <ol className={`relative flex flex-1 flex-col justify-between gap-3 py-1 lg:[@media(max-height:820px)]:gap-2`}>
              {/* Rail through the nodes, filling as the cards play in */}
              <span ref={railRef} {...{ [RAIL_ATTR]: "" }} aria-hidden="true" className="absolute bottom-6 left-[21px] top-6 w-[3px] rounded-full bg-navy/10" />
              <motion.span
                aria-hidden="true"
                className="absolute bottom-6 left-[21px] top-6 w-[3px] origin-top rounded-full bg-[linear-gradient(180deg,#1d4f9c,#2f7a3b,#1a5fa6,#9a6a22,#5b36a8)]"
                initial={false}
                animate={{
                  // With the train: fills station by station as each card settles in.
                  scaleY: flown ? (landed <= 1 ? 0 : (landed - 1) / (steps.length - 1)) : !pinned || reduceMotion || playCards ? 1 : 0,
                }}
                transition={
                  flown
                    ? { duration: 0.45, ease: EASE }
                    : { duration: pinned && playCards ? STAGGER * (steps.length - 1) + CARD_IN : 0, ease: "linear" }
                }
              />
              {steps.map((s, i) => (
                <StepCard
                  key={s.audience}
                  step={s}
                  index={i}
                  pinned={pinned}
                  pinnedPlay={playCards}
                  flown={flown}
                  landed={landed > i}
                  bodyRef={(el) => {
                    slotRefs.current[i] = el;
                  }}
                />
              ))}
            </ol>

            {/* Credentials */}
            <ul className="grid overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_14px_40px_-28px_rgba(23,34,54,0.45)] backdrop-blur-md sm:grid-cols-3 dark:border-white/10">
              {proof.map(({ icon: Icon, label }, i) => (
                <li
                  key={label}
                  className={`flex items-center justify-center gap-3 px-4 py-3.5 text-[13px] font-medium leading-snug text-navy/85 lg:[@media(max-height:820px)]:py-2.5 ${
                    i > 0 ? "max-sm:border-t sm:border-l border-navy/10" : ""
                  }`}
                >
                  <Icon className="size-6 shrink-0 text-navy/80" strokeWidth={1.5} />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* The stream from the hero's drain, coming out of the top edge (desktop) */}
          {flown && stream && <StreamRide stream={stream} track={trackRef} onLanded={setLanded} />}
        </Section>

        {/* Dims the frame as Our World opens over it */}
        {pinned && (
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-40 bg-[#0a1222]" style={{ opacity: coverDim }} />
        )}
      </motion.div>


    </div>
  );
}
