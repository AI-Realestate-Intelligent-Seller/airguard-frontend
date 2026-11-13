"use client";

import { motion, type Variants } from "motion/react";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Direction the content enters from. Keep subtle — this is a clinical/safety brand. */
  from?: "up" | "left" | "right" | "none";
  /** Resolve out of a soft defocus as well as fading. Reserve it for headings —
   *  animating `filter` is pricier than transform/opacity. */
  blur?: boolean;
};

const offsets: Record<NonNullable<RevealProps["from"]>, { x?: number; y?: number }> = {
  up: { y: 16 },
  left: { x: -16 },
  right: { x: 16 },
  none: {},
};

/**
 * Fades + nudges content into view once, on scroll. Wrap any section
 * child with this instead of hand-rolling motion.div + whileInView.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  blur = false,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const offset = offsets[from];

  const variants: Variants = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, ...offset, ...(blur ? { filter: "blur(10px)" } : null) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      ...(blur && !shouldReduceMotion ? { filter: "blur(0px)" } : null),
      transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
