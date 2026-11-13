"use client";

import { motion, type Variants } from "motion/react";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";

type WordRevealProps = {
  text: string;
  className?: string;
  /** Seconds between each word's reveal. */
  stagger?: number;
  /** Delay before the first word starts. */
  delay?: number;
};

/**
 * Reveals text one word at a time as it scrolls into view — each word
 * rises slightly out of a blur. Used for the closing statement + tail.
 */
export function WordReveal({ text, className, stagger = 0.06, delay = 0 }: WordRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  const word: Variants = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 16, filter: "blur(12px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={container}
    >
      {words.map((w, i) => (
        <motion.span key={i} variants={word} className="inline-block whitespace-pre">
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}
