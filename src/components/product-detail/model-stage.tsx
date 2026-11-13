"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ModelId } from "@/data/airguard-models";
import { useIsDark } from "@/hooks/use-is-dark";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";

/**
 * A model's 3D view for the detail pages: a light studio, or the rim-lit dark studio in dark mode. XP and MP use the full AirGuard
 * scene (MP without its display and camera); LT and CH use the basic models. Pull-apart and the
 * focused part come from refs the page updates on scroll, so the scene reads them every frame
 * without React re-rendering. Optional labels are pinned beside their parts by the scene.
 * three.js loads only once the stage is near the viewport.
 */
export function ModelStage({
  id,
  explode,
  focus,
  labels,
  onSelect,
  className,
  label,
}: {
  id: ModelId;
  explode?: RefObject<number>;
  focus?: RefObject<string | null>;
  labels?: { part: string; name: string }[];
  onSelect?: (part: string) => void;
  className?: string;
  /** Accessible description of the model view. */
  label: string;
}) {
  const reduce = useMotionPreference();
  const dark = useIsDark();
  const ref = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const selectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    selectRef.current = onSelect;
  });

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const opts = {
      reducedMotion: reduce,
      theme: dark ? ("dark" as const) : ("light" as const),
      getExplode: explode ? () => explode.current ?? 0 : undefined,
      getFocus: focus ? () => focus.current ?? null : undefined,
      getLabel: labels ? (part: string) => labelRefs.current[part] ?? null : undefined,
      onSelect: (part: string) => selectRef.current?.(part),
    };
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || cleanup) return;
        io.disconnect();
        try {
          if (id === "xp" || id === "mp") {
            const { mountAirGuard } = await import("@/components/three/airguard-xp-scene");
            if (!cancelled) cleanup = mountAirGuard(stage, { ...opts, variant: id });
          } else {
            const { mountBasicModel } = await import("@/components/three/airguard-basic-scene");
            if (!cancelled) cleanup = mountBasicModel(stage, { ...opts, model: id });
          }
          if (!cancelled) setReady(true);
        } catch (err) {
          console.error("AirGuard 3D view failed to load", err);
          setFailed(true);
        }
      },
      { rootMargin: "60% 0px" }
    );
    io.observe(stage);
    return () => {
      cancelled = true;
      io.disconnect();
      cleanup?.();
    };
    // explode / focus are refs and labels only matter on mount; remount per model and theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reduce, dark]);

  return (
    <div className={cn("relative", className)}>
      <div ref={ref} role="img" aria-label={label} className="absolute inset-0" />

      {labels && (
        // Desktop only: on narrow screens the pills would run off the edges (the page names the part instead).
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 transition-opacity duration-500 max-lg:hidden", ready ? "opacity-100" : "opacity-0")}>
          {labels.map((l) => (
            <div
              key={l.part}
              ref={(el) => {
                labelRefs.current[l.part] = el;
              }}
              className="group/label absolute left-0 top-0 transition-opacity duration-300 data-[active=0]:opacity-45 data-[active=0]:data-[hidden=1]:opacity-20"
            >
              <span className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 shadow-[0_0_0_5px_rgba(64,103,177,0.18)] [left:var(--ax)] [top:var(--ay)] group-data-[active=1]/label:size-2.5 dark:bg-brand-300 dark:shadow-[0_0_0_5px_rgba(112,141,196,0.25)] dark:group-data-[active=1]/label:bg-white" />
              <span className="absolute h-px origin-left bg-navy/30 [left:var(--ax)] [rotate:var(--ang)] [top:var(--ay)] [width:var(--len)] group-data-[active=1]/label:bg-navy/75" />
              <span className="absolute -translate-y-1/2 [left:var(--ex)] [top:var(--ey)] group-data-[side=left]/label:-translate-x-full">
                <span className="mx-1.5 block w-max rounded-full border border-navy/10 bg-white/90 px-3 py-1 text-[11px] font-medium tracking-[0.02em] text-navy/80 shadow-[0_8px_20px_-14px_rgba(23,34,54,0.5)] backdrop-blur-md dark:border-white/15 dark:bg-[#0e1a2e]/80 dark:text-white/85 dark:shadow-none dark:group-data-[active=1]/label:border-brand-400 dark:group-data-[active=1]/label:bg-brand-500 dark:group-data-[active=1]/label:text-white transition-colors group-data-[active=1]/label:border-brand-400 group-data-[active=1]/label:bg-brand-500 group-data-[active=1]/label:text-white">
                  {l.name}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {!ready && (
          <motion.div exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center">
            {failed ? (
              <p className="text-sm text-navy/60">The 3D view couldn&apos;t load in this browser.</p>
            ) : (
              <span className="size-8 animate-spin rounded-full border-2 border-navy/15 border-t-brand-500 dark:border-t-brand-300" aria-label="Loading 3D view" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
