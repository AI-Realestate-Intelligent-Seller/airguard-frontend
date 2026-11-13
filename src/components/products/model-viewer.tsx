"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Hand } from "lucide-react";
import { AirGuardStage } from "@/components/sections/airguard-3d";
import type { ModelId } from "@/data/airguard-models";
import { useMotionPreference } from "@/hooks/use-motion-preference";

/**
 * The 3D model for one AirGuard, filling its positioned parent.
 * XP: the full labelled model. MP: the same model without its display and camera (the docs
 * define MP as XP without the camera / magnification layer). LT and CH: basic procedural models.
 */
export function ModelViewer({ id }: { id: ModelId }) {
  if (id === "xp" || id === "mp") return <AirGuardStage key={id} variant={id} />;
  return <BasicStage key={id} model={id} />;
}

function BasicStage({ model }: { model: "lt" | "ch" }) {
  const reduce = useMotionPreference();
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    import("@/components/three/airguard-basic-scene")
      .then(({ mountBasicModel }) => {
        if (cancelled) return;
        cleanup = mountBasicModel(stage, { model, reducedMotion: reduce });
        setReady(true);
      })
      .catch((err) => {
        console.error("AirGuard 3D view failed to load", err);
        setFailed(true);
      });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [model, reduce]);

  return (
    <>
      <div ref={ref} role="img" aria-label={`Basic 3D model of AirGuard ${model.toUpperCase()}. Drag to turn it.`} className="absolute inset-0" />
      <AnimatePresence>
        {!ready && (
          <motion.p exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-navy/50">
            {failed ? "The 3D view couldn't load in this browser." : "Preparing the 3D view…"}
          </motion.p>
        )}
      </AnimatePresence>
      {ready && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs text-navy/70 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            <Hand className="size-3.5" aria-hidden="true" /> Drag to turn · Illustrative model
          </p>
        </div>
      )}
    </>
  );
}
