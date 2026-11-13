"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";
import logo from "../../../public/images/brand/airguard-logo-white.png";

const subscribeToHydration = () => () => {};

type AnimatedLogoProps = {
  /** Rendered height of the logo mark, in px. Needs a real number so the
   *  ring/particle halo around it can be positioned in matching pixels. */
  size: number;
  rings?: number;
  particleCount?: number;
  glow?: boolean;
  alt?: string;
  className?: string;
};

function buildParticles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const radius = 0.62 + ((i * 0.37) % 0.3);
    return { id: i, angle, radius, delay: (i % 7) * 0.5, duration: 4 + (i % 5) };
  });
}

/**
 * The AirGuard mark with an optional ambient glow, expanding "protection"
 * rings, and drifting particles (echoing the dots in the shield itself).
 * Used at full strength as the site's "closing moment" in the footer, and
 * at glow-only strength in the sticky header where it has to stay calm.
 */
export function AnimatedLogo({
  size,
  rings = 0,
  particleCount = 0,
  glow = true,
  alt = "",
  className,
}: AnimatedLogoProps) {
  const shouldReduceMotion = useReducedMotion();
  // useReducedMotion can't know the user's setting during SSR, so the rings and
  // particles would render on the server and vanish on the client, tripping a
  // hydration mismatch. Mount them only after hydration, when the answer is known.
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const showMotionParts = mounted && !shouldReduceMotion;
  const particles = buildParticles(particleCount);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {glow && (
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--brand-300) 55%, transparent), transparent 70%)",
          }}
          animate={
            shouldReduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [1, 1.1, 1] }
          }
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {showMotionParts &&
        Array.from({ length: rings }).map((_, i) => (
          <motion.div
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/40"
            style={{ width: size * 1.3, height: size * 1.3 }}
            initial={{ scale: 0.7, opacity: 0.6 }}
            animate={{ scale: [0.7, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: i * 1.75 }}
          />
        ))}

      {showMotionParts &&
        particles.map((p) => {
          const r = p.radius * size;
          // Rounded so the server- and client-rendered inline transform
          // strings match exactly and React doesn't flag a hydration mismatch.
          const x = Math.round(Math.cos(p.angle) * r * 100) / 100;
          const y = Math.round(Math.sin(p.angle) * r * 100) / 100;
          return (
            <motion.span
              key={p.id}
              aria-hidden
              className="absolute left-1/2 top-1/2 size-1 rounded-full bg-brand-200"
              initial={{ x, y, opacity: 0 }}
              animate={{ x: [x, x * 0.3, x], y: [y, y * 0.3, y], opacity: [0, 0.85, 0] }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
              }}
            />
          );
        })}

      <Image src={logo} alt={alt} style={{ height: size, width: "auto" }} />
    </div>
  );
}
