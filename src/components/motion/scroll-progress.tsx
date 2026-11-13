"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * Thin fixed progress bar tracking how far down the page the reader is.
 * A restrained stand-in for a "continuous glide" cue — no bounce, no color shift.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-brand-400"
      style={{ scaleX }}
    />
  );
}
