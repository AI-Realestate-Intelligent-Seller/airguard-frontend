"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, ChevronDown, ShieldCheck } from "lucide-react";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMenuOpen } from "@/hooks/use-menu-open";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { AnimatedLogo } from "@/components/motion/animated-logo";
import { HeroRing, wheelGeometry } from "@/components/sections/hero-ring";
import { OUR_WORLD_TRACK_ID, OUR_WORLD_TOUR_START } from "@/components/sections/our-world-stage";
import { JOURNEY_TRACK_ID, JOURNEY_LANDED_SCREENS } from "@/components/sections/family-story";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { heroSlides } from "@/data/hero-slides";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Words rise out of a blur, one after the next. */
function TitleWords({
  text,
  className,
  wordClassName,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className={cn("inline-block whitespace-pre", wordClassName)}
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : isMobile
              ? { opacity: 0, y: 14 }
              : { opacity: 0, y: 24, scale: 0.88, filter: "blur(12px)" }
          }
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: delay + i * 0.08, ease: EASE }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

function FadeUp({ children, delay, className }: { children: ReactNode; delay: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/*
 * Scroll story, in screens (svh) of scrolling through the pinned track:
 *     0 –  20  pill and dock fade away
 *    10 – 100  the arc of cards closes into a wheel round the headline, which shrinks to sit inside it
 *   100 – 124  the wheel holds; after a short beat the page glides on by itself
 * Then the hero scrolls away and the Journey comes up from below. In step with that scroll, the
 * wheel breaks open at 9 o'clock and uncoils: its cards run out through the break in one strip,
 * down the left and over the hero's bottom edge, and the strip carries on into the Journey, where
 * five cards become its cards one by one (family-story.tsx).
 * Our World's four cards follow the Journey, in their own pinned frame (our-world-stage.tsx).
 */
const PINNED_SVH = 124; // keep in step with the track height (PINNED_SVH + 100)
const at = (svh: number) => svh / PINNED_SVH;
const MORPH = [at(10), at(100)] as const;
const CIRCLE_DONE = at(100);
const REVEALED = 1;
const TEXT_MIN = 0.72; // headline scale once the wheel has closed round it
const AUTO_ADVANCE_DELAY = 450; // ms the finished orbit is held before moving on
const GLIDE_MS = 2200;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let glideActive = false;

/** Eased scroll to a y position (or one re-measured every frame, for targets that may still shift
    as the page settles); any wheel, touch or key input hands control straight back. */
function glideTo(top: number | (() => number), duration = GLIDE_MS) {
  glideActive = true;
  const from = window.scrollY;
  const target = typeof top === "function" ? top : () => top;
  const start = performance.now();
  const root = document.documentElement;
  const prevBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto"; // the global smooth-scroll would fight each step
  let raf = 0;
  const stop = () => {
    glideActive = false;
    cancelAnimationFrame(raf);
    root.style.scrollBehavior = prevBehavior;
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, from + (target() - from) * easeInOutCubic(t));
    if (t < 1) raf = requestAnimationFrame(step);
    else stop();
  };
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  raf = requestAnimationFrame(step);
  return stop;
}

/** Scroll position for a point (0–1) along the pinned track. */
function trackPoint(track: HTMLElement | null, at: number) {
  if (!track) return null;
  const trackTop = track.getBoundingClientRect().top + window.scrollY;
  return trackTop + (track.offsetHeight - window.innerHeight) * at;
}

export function Hero() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  // How far the copy must move to sit in the middle of the finished circle.
  const [copyShift, setCopyShift] = useState(0);
  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      const copy = copyRef.current;
      if (!stage || !copy) return;
      let top = copy.offsetHeight / 2;
      for (let el: HTMLElement | null = copy; el && el !== stage; el = el.offsetParent as HTMLElement | null) {
        top += el.offsetTop;
      }
      setCopyShift(wheelGeometry(window.innerWidth, stage.clientHeight).cy - top);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const shouldReduceMotion = useReducedMotion();
  const menuOpen = useMenuOpen();

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const textOpacity = useMotionValue(1); // the copy simply scrolls away with the hero
  const textScale = useTransform(scrollYProgress, [MORPH[0], MORPH[1] * 0.8], [1, TEXT_MIN]);
  const textPointer = useTransform(textOpacity, (v) => (v < 0.05 ? "none" : "auto"));
  const chromeOpacity = useTransform(scrollYProgress, [0, at(20)], [1, 0]);
  const chromePointer = useTransform(chromeOpacity, (v) => (v < 0.05 ? "none" : "auto"));
  const morph = useTransform(scrollYProgress, [...MORPH], [0, 1]);
  const textY = useTransform(scrollYProgress, [MORPH[0], MORPH[1] * 0.8], [0, copyShift]);
  // The wheel never spreads open. Once the hero lets go and scrolls away, the same ring breaks
  // open and uncoils with the scroll, over the hero's bottom edge and on into the Journey below.
  const exit = useMotionValue(0);
  const drains = useIsDesktop() && !shouldReduceMotion;
  const { scrollYProgress: leaving } = useScroll({ target: trackRef, offset: ["end end", "end start"] });
  const drainAll = useTransform(leaving, [0, 1], [0, 1]); // in step with the scroll
  const noDrain = useMotionValue(0);
  const drain = drains ? drainAll : noDrain;
  /** "Learn More": straight to the four cards (after the Journey), all of them in and ready to open. */
  const goToCards = () => {
    const top = trackPoint(document.getElementById(OUR_WORLD_TRACK_ID), OUR_WORLD_TOUR_START);
    if (top === null) return;
    if (shouldReduceMotion) window.scrollTo({ top, behavior: "auto" });
    else glideTo(top, 2800);
  };

  // Once the circle has closed, hold it for a beat, then glide on to the Journey.
  useEffect(() => {
    if (shouldReduceMotion) return;
    let prev = scrollYProgress.get();
    let fired = false;
    let timer = 0;
    let stopGlide: (() => void) | null = null;
    const cancel = () => {
      window.clearTimeout(timer);
      timer = 0;
    };
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const down = v > prev;
      prev = v;
      if (v < CIRCLE_DONE - at(20)) fired = false; // scrolled back up: arm again
      if (v < CIRCLE_DONE || v >= REVEALED - 0.01 || !down) return cancel();
      if (fired || timer || glideActive) return;
      timer = window.setTimeout(() => {
        timer = 0;
        const now = scrollYProgress.get();
        if (now < CIRCLE_DONE || now >= REVEALED - 0.01) return;
        const journey = document.getElementById(JOURNEY_TRACK_ID);
        if (!journey) return;
        fired = true;
        // Down into the Journey, until the stream's cards have all landed.
        stopGlide = glideTo(
          () => journey.getBoundingClientRect().top + window.scrollY + window.innerHeight * JOURNEY_LANDED_SCREENS,
          6000 // slow, so the uncoiling strip can be followed
        );
      }, AUTO_ADVANCE_DELAY);
    });
    return () => {
      unsubscribe();
      cancel();
      stopGlide?.();
    };
  }, [scrollYProgress, shouldReduceMotion]);

  return (
    // The tall track gives the pinned hero room to play its scroll story.
    <div ref={trackRef} className="relative h-[224svh]">
    {/* Sticky lives on this wrapper: a global rule forces section[data-theme] to position: relative. */}
    <motion.div ref={stageRef} className="sticky top-0 h-[100svh]">
    <Section
      id="discover"
      aria-label="AirGuard Health"
      theme="white"
      className="isolate flex h-full flex-col overflow-hidden pt-[100px] pb-0 md:pt-[128px] md:pb-16 lg:pt-[132px] lg:pb-16 [@media(max-height:500px)]:pt-[96px]"
    >
      {/* Night-sky backdrop in AirGuard navy, lit from below in brand blue. */}
      <div aria-hidden className="hero-sky absolute inset-0 -z-10">
        <div className="hero-sky-grid" />
      </div>

      {/* ── stage: the ring spins behind the copy ── */}
      <div className="relative flex flex-1 flex-col justify-center py-8 min-h-[400px] sm:min-h-[520px] md:min-h-[540px] md:py-12">
        {/* Ring layer, centred on the copy (its cards' centre sits 55% down the ring box). */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-[55%]">
          <div className="pointer-events-auto">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 60 }}
              animate={{ opacity: menuOpen ? 0 : 1, y: 0 }}
              transition={{ duration: menuOpen ? 0.2 : 1.1, delay: menuOpen ? 0 : 0.2, ease: EASE }}
            >
              <HeroRing reducedMotion={shouldReduceMotion} paused={menuOpen} morph={morph} exit={exit} drain={drain} />
            </motion.div>
          </div>
        </div>

        {/* Navy glow behind the text keeps it readable over the cards. */}
        <motion.div
          aria-hidden
          className="hero-text-scrim pointer-events-none absolute inset-0 z-10"
          style={{ opacity: textOpacity }}
        />

      {/* ── copy ── */}
      <motion.div
        className="relative z-20"
        ref={copyRef}
        style={{
          scale: shouldReduceMotion ? 1 : textScale,
          y: textY,
          opacity: textOpacity,
          pointerEvents: textPointer,
        }}
      >
        <Container className="flex flex-col items-center text-center">
          {/* Brand pill: above the heading on phones/tablets; on desktop it sits below the cards */}
          <FadeUp delay={0} className="lg:hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 py-1 pl-1 pr-3.5 shadow-[0_6px_18px_-12px_rgba(23,34,54,0.35)] backdrop-blur-md">
              <AnimatedLogo size={22} glow={false} alt="" />
              <span className="text-[11px] font-medium tracking-wide text-navy/80 sm:text-xs">
                <span className="font-semibold uppercase tracking-[0.14em] text-brand-500">AirGuard Health</span>
                <span className="mx-1.5 text-navy/30">/</span>
                <span className="uppercase tracking-[0.14em]">Innovation &amp; Wellness</span>
              </span>
            </div>
          </FadeUp>

          <h1 className="mt-5 max-w-[16ch] text-[clamp(2rem,9.4vw,2.4rem)] font-medium leading-[1.05] tracking-tight text-navy sm:text-6xl md:mt-6 lg:max-w-none lg:text-7xl [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:text-4xl">
            <TitleWords text="A New Era of" delay={0.1} />
            <br />
            <TitleWords
              text="Health & Wellness."
              delay={0.26}
              className="font-bold"
              wordClassName="bg-[linear-gradient(90deg,#4067b1_0%,#5b80c8_100%)] bg-clip-text text-transparent"
            />
          </h1>

          <FadeUp delay={0.42}>
            <p className="mt-4 max-w-[34rem] text-base text-muted-foreground sm:text-lg md:mt-5">
              Exploring better ways to live through innovative technology, thoughtful wellness products, and knowledge that empowers.
            </p>
          </FadeUp>

          <FadeUp delay={0.54} className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-8">
            <a
              href="#our-world"
              onClick={(e) => {
                e.preventDefault();
                goToCards();
              }}
              className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-6 text-sm shadow-[0_8px_28px_-8px_#4067b1] sm:text-base")}
            >
              Learn More
            </a>
            <Link
              href="/contact#contact-form"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-11 rounded-full border border-navy/15 bg-white/70 px-6 text-sm text-navy hover:border-brand-400 hover:bg-white hover:text-brand-500 sm:text-base"
              )}
            >
              Contact Us
            </Link>
          </FadeUp>

          <FadeUp delay={0.62} className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground sm:text-xs md:mt-6">
            <ShieldCheck className="size-4 text-brand-500" />
            <span>
              <span className="font-semibold text-navy">FDA Registered</span>
              <span className="mx-1.5 text-navy/30">·</span>
              Patented products designed with Beyond Design
            </span>
          </FadeUp>

        </Container>
      </motion.div>

      </div>

      <motion.div className="relative z-20" style={{ opacity: chromeOpacity, pointerEvents: chromePointer }}>
      {/* ── Brand pill (desktop): below the cards so it never sits on them ── */}
      <FadeUp delay={0.66} className="relative z-20 mb-6 hidden justify-center lg:flex">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 py-1 pl-1 pr-3.5 shadow-[0_6px_18px_-12px_rgba(23,34,54,0.35)] backdrop-blur-md">
          <AnimatedLogo size={22} glow={false} alt="" />
          <span className="text-[11px] font-medium tracking-wide text-navy/80 sm:text-xs">
            <span className="font-semibold uppercase tracking-[0.14em] text-brand-500">AirGuard Health</span>
            <span className="mx-1.5 text-navy/30">/</span>
            <span className="uppercase tracking-[0.14em]">Innovation &amp; Wellness</span>
          </span>
        </div>
      </FadeUp>

      {/* ── brand dock: sits below the stage so it never covers the cards ── */}
      <FadeUp delay={0.7} className="relative z-20 mb-11 md:mb-12">
        <Container className="max-w-[920px] px-4 md:px-6 lg:px-6">
          <nav aria-label="Our brands" className="hero-dock rounded-[26px] px-3 pt-3 pb-3 md:px-4 md:pt-4 md:pb-4">
            <div className="mb-2.5 flex items-center justify-between px-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <span>One family of brands</span>
              <span className="hidden sm:inline">Drag the ring to explore</span>
            </div>
            <ul className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
              {heroSlides.map((s) => (
                <li key={s.id}>
                  <Link
                    href={s.cta.href}
                    className="group flex h-full items-start justify-between gap-2 rounded-2xl border border-brand-100 bg-white/70 px-3 py-3 transition-colors hover:border-brand-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-navy">
                        <span
                          aria-hidden
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: s.accent, boxShadow: `0 0 8px ${s.accent}` }}
                        />
                        <span className="leading-tight">{s.id === "airguard" ? "AirGuard" : s.eyebrow}</span>
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{s.tagline}</span>
                    </span>
                    <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-navy/30 transition-colors group-hover:text-brand-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </FadeUp>

      {/* Scroll cue: a mouse outline with a drifting wheel dot and a chevron, no background,
          bobbing gently; fades out with the rest of the hero chrome once you start scrolling. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-1.5 z-20 flex justify-center md:bottom-2">
        <motion.div
          className="flex flex-col items-center text-navy/55"
          animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="relative block h-[26px] w-[16px] rounded-full border-[1.5px] border-current">
            <motion.span
              className="absolute left-1/2 top-[5px] block h-[5px] w-[2px] -translate-x-1/2 rounded-full bg-current"
              animate={shouldReduceMotion ? undefined : { y: [0, 6, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
          <ChevronDown className="-mt-0.5 size-3.5" strokeWidth={2.25} />
        </motion.div>
      </div>
      </motion.div>
    </Section>

    </motion.div>
    </div>
  );
}
