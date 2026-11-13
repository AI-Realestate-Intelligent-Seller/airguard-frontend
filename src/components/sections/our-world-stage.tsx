"use client";

import { useRef } from "react";
import { useScroll, useTransform } from "motion/react";
import { OurWorld } from "@/components/sections/our-world";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { useIsDesktop } from "@/hooks/use-is-desktop";

/*
 * Our World's own pinned frame, after the Journey. Scroll story, in screens (svh) of scrolling
 * through the pinned track:
 *     0 – 100  (desktop) opens through a growing circle over the pinned Journey, which dims
 *              beneath it; its heading shows
 *   100 – 150  the heading holds
 *   150 – 350  the heading clears and the four cards rise in one by one, all closed
 *   350 – 550  then, and only then, scrolling opens each card in turn
 * Then the frame lets go and the AirGuard 3D section simply scrolls up after it.
 * Phones and tablets don't overlap the Journey: the frame simply pins as it arrives.
 */
const PINNED_SVH = 550; // keep in step with the track height (PINNED_SVH + 100)
const at = (svh: number) => svh / PINNED_SVH;
const OPEN = [0, at(100)] as const;
const SHOW = [at(150), at(350)] as const;
const TOUR = [at(350), at(550)] as const;

/** For the hero's "Learn More": the track's id and the point where all four cards are in. */
export const OUR_WORLD_TRACK_ID = "our-world-track";
export const OUR_WORLD_TOUR_START = TOUR[0];

export function OurWorldStage() {
  const reduceMotion = useReducedMotion();
  const pinned = useIsDesktop();
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const reveal = useTransform(scrollYProgress, [...OPEN], [0, 1]);
  const show = useTransform(scrollYProgress, [...SHOW], [0, 1]);
  const tour = useTransform(scrollYProgress, [...TOUR], [0, 1]);
  const opens = pinned && !reduceMotion;

  return (
    // Desktop: overlaps the end of the Journey's pinned track (see its cover phase) and opens over it.
    <div id={OUR_WORLD_TRACK_ID} ref={trackRef} className="relative z-30 h-[650svh] lg:-mt-[200svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <OurWorld opening="center" reveal={opens ? reveal : undefined} show={show} tour={tour} />
      </div>
    </div>
  );
}
