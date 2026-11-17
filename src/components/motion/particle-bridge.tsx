"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useIsDark } from "@/hooks/use-is-dark";
import { useT } from "@/i18n/locale";
import { EASE } from "@/lib/motion";
import type { Story, StoryKind } from "@/components/three/particle-story";
import { dropBus } from "@/components/motion/liquid-reveal";
import { carryDrop as carryDropOverlay } from "@/components/motion/drop-carry";

/*
 * A particle story between two home page sections (particle-story.ts), one screen tall. It plays
 * by itself: once most of it is on screen the field runs through its five forms on a timer, one
 * caption each, then glides the page on to the next section (which opens with its own reveal).
 * With `carryDrop` (Genesis) the drop the particles end on is carried down with the glide
 * (drop-carry.ts): it falls to the centre of the next section and bursts there, and that section
 * opens from the burst (dropBus).
 * If the visitor has already scrolled on, it doesn't pull them back; coming back replays it.
 * Reduced motion: no autoplay or glide; the last caption shows with the final form.
 */

export type Caption = { kicker: string; title: string; line?: string };

/** When each form starts (seconds from the start of play), and when the page moves on. */
const BEATS = [0, 1.7, 3.5, 5.3, 7.0];
const END = 8.4;

export function ParticleBridge({
  id,
  kind,
  captions,
  glow,
  bg,
  footer,
  hold = 0,
  carryDrop = false,
}: {
  id: string;
  kind: StoryKind;
  /** One per form (five). */
  captions: Caption[];
  /** Background glow colour behind the particles. */
  glow: string;
  /** The section's background, top → bottom, matching the sections above and below (light / dark pages). */
  bg: { light: [string, string]; dark: [string, string] };
  /** Shown with the last caption (a call to action). */
  footer?: ReactNode;
  /** Extra seconds to stay on the last form before moving on (time to read the footer). */
  hold?: number;
  /** Carry the final drop down into the next section instead of letting it fall out of frame. */
  carryDrop?: boolean;
}) {
  const t = useT();
  const reduce = useMotionPreference();
  const dark = useIsDark();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const story = useRef<Story | null>(null);
  const [step, setStep] = useState(0);

  // the particle field, loaded as the section comes near
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || story.current) return;
        io.disconnect();
        import("@/components/three/particle-story").then(({ mountStory }) => {
          if (cancelled) return;
          story.current = mountStory(c, kind, { reduced: reduce, theme: dark ? "dark" : "light" });
          // development only: lets a visual check jump a story to any form
          if (process.env.NODE_ENV === "development") ((window as unknown as { __stories?: Record<string, Story> }).__stories ??= {})[id] = story.current;
          if (reduce) story.current.setChapter(3);
        });
      },
      { rootMargin: "80% 0px" }
    );
    io.observe(c);
    const move = (e: PointerEvent) => story.current?.setPointer(e.clientX, e.clientY);
    const leave = () => story.current?.setPointer(null, null);
    const host = c.parentElement;
    host?.addEventListener("pointermove", move);
    host?.addEventListener("pointerleave", leave);
    return () => {
      cancelled = true;
      io.disconnect();
      host?.removeEventListener("pointermove", move);
      host?.removeEventListener("pointerleave", leave);
      story.current?.dispose();
      story.current = null;
    };
  }, [id, kind, reduce, dark]);

  // autoplay: runs when the section is mostly on screen, resets when it leaves
  useEffect(() => {
    const el = section.current;
    if (!el || reduce) return;
    let timers: number[] = [];
    let playing = false;
    const clear = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    const play = () => {
      playing = true;
      clear();
      BEATS.forEach((at, i) =>
        timers.push(
          window.setTimeout(() => {
            // carrying the drop: it stays a drop until the glide takes it down
            if (!(carryDrop && i === BEATS.length - 1)) story.current?.setChapter(i);
            setStep(i);
          }, at * 1000)
        )
      );
      // move on to the next section, unless the visitor has already scrolled away from this one
      timers.push(
        window.setTimeout(() => {
          const r = el.getBoundingClientRect();
          const stillHere = r.top > -innerHeight * 0.35 && r.top < innerHeight * 0.35;
          const next = el.nextElementSibling as HTMLElement | null;
          if (!stillHere || !next) return;
          if (carryDrop && canvas.current) carry(canvas.current, next);
          else window.scrollTo({ top: next.getBoundingClientRect().top + scrollY, behavior: "smooth" });
        }, (END + hold) * 1000)
      );
    };
    // the drop's ride into the next section: handed to an overlay copy that falls and bursts there
    let carrying = false;
    let cancelRun = () => {};
    const carry = (c: HTMLCanvasElement, next: HTMLElement) => {
      const r = c.getBoundingClientRect();
      carrying = true;
      dropBus.incoming = true;
      const stop = carryDropOverlay({
        from: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        storyHeight: r.height,
        scrollTo: next.getBoundingClientRect().top + scrollY,
        dark,
        small: innerWidth < 768,
        onLand: (x, y) => {
          dropBus.land(x, y);
          carrying = false;
          c.style.opacity = "";
          story.current?.setChapter(0); // back to the start for the next visit (it's off screen now)
        },
      });
      c.style.opacity = "0"; // the copy takes over in the same frame
      cancelRun = () => {
        stop();
        c.style.opacity = "";
        carrying = false;
      };
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.6 && !playing) play();
        else if (e.intersectionRatio < 0.05 && playing) {
          // gone: reset, so coming back plays it again
          playing = false;
          clear();
          if (!carrying) story.current?.setChapter(0); // not while the drop is still falling
          setStep(0);
        }
      },
      { threshold: [0, 0.05, 0.6] }
    );
    io.observe(el);
    return () => {
      clear();
      io.disconnect();
      cancelRun();
      dropBus.incoming = false;
    };
  }, [reduce, hold, captions.length, carryDrop, dark]);

  // reduced motion: no autoplay, the story is shown at its last caption
  const shown = reduce ? captions.length - 1 : step;
  const cap = captions[shown];
  return (
    <section
      ref={section}
      id={id}
      aria-label={t(captions[captions.length - 1].kicker)}
      className="relative h-svh min-h-[560px] overflow-hidden"
      // one continuous colour from the section above to the section below, in either theme
      style={{ background: `linear-gradient(180deg, ${(dark ? bg.dark : bg.light)[0]}, ${(dark ? bg.dark : bg.light)[1]})` }}
    >
      <div aria-hidden="true" className="absolute inset-0" style={{ background: `radial-gradient(60% 55% at 50% 50%, ${glow}${dark ? "33" : "22"}, transparent 70%)` }} />
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />
      {/* progress: which form is playing */}
      <div aria-hidden="true" className="absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 md:right-10">
        {captions.map((_, i) => (
          <span key={i} className="block w-1 rounded-full bg-navy/70 transition-all duration-500 dark:bg-white/80" style={{ height: i === shown ? 22 : 6, opacity: i <= shown ? 0.9 : 0.25 }} />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:px-12 md:pb-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={shown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="max-w-xl text-navy dark:text-white"
          >
            <p className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: dark ? glow : "#2f5aa8" }}>
              {t(cap.kicker)}
            </p>
            <h2 className="mt-2 text-[clamp(2rem,6vw,3.75rem)] font-medium leading-[1.05] tracking-tight">{t(cap.title)}</h2>
            {cap.line && <p className="mt-3 max-w-md text-sm leading-relaxed text-navy/70 md:text-base dark:text-white/70">{t(cap.line)}</p>}
            {shown === captions.length - 1 && footer}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
