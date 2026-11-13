"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { cfdByModel, cfdCredit } from "@/data/airguard-technology";
import { modelById, type ModelId } from "@/data/airguard-models";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";
import { type } from "@/components/products/type";

const EASE = [0.16, 1, 0.3, 1] as const;
/** The CFD renders' own backdrop, so the panel and image read as one surface. */
const CFD_BG = "#7476dc";
/** The same backdrop as the VP9 animation decodes it, so the letterbox bands disappear. */
const CFD_VIDEO_BG = "#7279e0";
const ZOOM = 2.4;
const LENS = 180;

/**
 * Airflow simulations (CFD) from airguardhealth.com/technology: the model's own analysis, the
 * animated study and the hose-only comparison. Tabs crossfade the views; on desktop a magnifier
 * lens follows the pointer over still images so the velocity legend and particle paths can be read.
 * Not shown for CH (no suction integration).
 */
export function DetailCfd({ id }: { id: ModelId }) {
  const views = cfdByModel[id];
  const m = modelById[id];
  const reduce = useMotionPreference();
  const [active, setActive] = useState(0);
  const [lens, setLens] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  if (!views) return null;
  const v = views[active];

  return (
    <section id="cfd" aria-labelledby="cfd-title" className="scroll-mt-24 bg-[#eef0fb] py-20 md:py-28 dark:bg-[#121a30]">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 md:px-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:gap-14 xl:px-[4vw]">
        <div className="flex flex-col">
          <p className={type.eyebrow}>CFD analysis</p>
          <h2 id="cfd-title" className={`mt-3 ${type.h2}`}>
            Powerful, Uninhibited Airflow
          </h2>

          <div role="tablist" aria-label={`${m.name} airflow simulations`} className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b lg:border-navy/10">
            {views.map((view, i) => {
              const on = i === active;
              return (
                <button
                  key={view.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="cfd-panel"
                  onClick={() => setActive(i)}
                  className={cn(
                    "group relative shrink-0 rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors lg:rounded-none lg:border-0 lg:border-t lg:border-navy/10 lg:px-0 lg:py-4",
                    on ? "border-brand-500 bg-brand-500 text-white lg:bg-transparent lg:text-navy" : "border-navy/15 text-navy/60 hover:text-navy"
                  )}
                >
                  <span className="hidden text-xs tabular-nums text-brand-600 lg:mr-4 lg:inline dark:text-brand-300">{String(i + 1).padStart(2, "0")}</span>
                  {view.label}
                  {on && (
                    <motion.span
                      layoutId="cfd-tab-bar"
                      className="absolute -top-px left-0 hidden h-0.5 w-full bg-brand-500 lg:block"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={v.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mt-6 text-[15px] leading-relaxed text-muted-foreground"
            >
              {v.caption}
            </motion.p>
          </AnimatePresence>
          <p className="mt-6 text-xs text-muted-foreground lg:mt-auto lg:pt-8">{cfdCredit}</p>
        </div>

        <div
          id="cfd-panel"
          role="tabpanel"
          onPointerMove={(e) => {
            if (v.video || e.pointerType !== "mouse") return;
            const r = e.currentTarget.getBoundingClientRect();
            setLens({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
          }}
          onPointerLeave={() => setLens(null)}
          style={{ backgroundColor: v.video ? CFD_VIDEO_BG : CFD_BG }}
          className={cn("relative aspect-[5/4] overflow-hidden transition-colors duration-500 rounded-3xl shadow-[0_30px_60px_-36px_rgba(23,34,54,0.55)]", !v.video && "lg:cursor-none")}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={v.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="absolute inset-0"
            >
              {v.video ? (
                <video
                  // Set muted on the element itself and start it once mounted: browsers only autoplay
                  // muted video, and React's `muted` prop isn't reliably reflected before play.
                  ref={(el) => {
                    if (!el) return;
                    el.muted = true;
                    if (!reduce) void el.play().catch(() => {});
                  }}
                  className="size-full object-contain"
                  src={v.video}
                  poster={v.image.src}
                  preload="auto"
                  muted
                  loop
                  playsInline
                  aria-label={v.label}
                />
              ) : (
                <Image src={v.image} alt={v.label} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain" />
              )}
            </motion.div>
          </AnimatePresence>

          {/* magnifier lens (desktop, still images) */}
          {lens && !v.video && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-10 hidden rounded-full border-2 border-white/80 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)] lg:block"
              style={{
                width: LENS,
                height: LENS,
                left: lens.x - LENS / 2,
                top: lens.y - LENS / 2,
                backgroundColor: CFD_BG,
                backgroundImage: `url(${v.image.src})`,
                backgroundRepeat: "no-repeat",
                // the image is object-contain in a 5:4 panel with a 5:4 source, so it fills the panel
                backgroundSize: `${lens.w * ZOOM}px ${lens.h * ZOOM}px`,
                backgroundPosition: `${-(lens.x * ZOOM - LENS / 2)}px ${-(lens.y * ZOOM - LENS / 2)}px`,
              }}
            />
          )}
          {!v.video && (
            <span className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur lg:inline-flex">
              <Search className="size-3.5" aria-hidden="true" /> Hover to magnify
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
