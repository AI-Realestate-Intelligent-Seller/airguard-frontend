"use client";

import { motion, type Variants } from "motion/react";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TiltInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Degrees the card is tipped away before it settles upright. */
  angle?: number;
};

/**
 * Cards arrive tipped back in perspective and stand up as they enter view —
 * the page's "lifting off the surface" motif. Perspective has to live on the
 * wrapper, not the element that rotates, so this renders two nested divs.
 *
 * Transform/opacity only: both are compositor-driven, so a grid of these still
 * animates on one frame budget. Collapses to a plain fade under reduced motion.
 */
export function TiltIn({ children, className, delay = 0, angle = 15 }: TiltInProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4, delay } },
      }
    : {
        hidden: { opacity: 0, y: 38, rotateX: angle, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          transition: { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] },
        },
      };

  return (
    <motion.div
      className={cn("[perspective:1200px]", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.div
        variants={variants}
        className="h-full"
        // Hinged at the bottom edge, so the card tips up toward the reader
        // rather than pivoting around its middle.
        style={{ transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
