"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { ChevronRight } from "lucide-react";
import { AddToCart } from "@/components/cart/add-to-cart";
import { ModelStage } from "@/components/product-detail/model-stage";
import { modelById, type ModelId } from "@/data/airguard-models";
import { formatUsd } from "@/lib/cart";
import { useMotionPreference } from "@/hooks/use-motion-preference";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Product hero, after the MotionSites "Quantum Human" layout: a light studio (dark navy in dark
 * mode), the model lit in brand blue at the centre (turning slowly, tilting toward the cursor), a
 * large headline anchored bottom-left and the documented description, price and Shop now on the
 * right. Scrolling away lifts and fades the type while the model eases back.
 * Shared by /products/[model] and /scientific-research/[model]: `crumb` adds a last breadcrumb
 * level (the model name then links back to its product page) and `next` is the scroll cue's target.
 */
export function DetailHero({ id, crumb, next = "#anatomy" }: { id: ModelId; crumb?: string; next?: string }) {
  const m = modelById[id];
  const reduce = useMotionPreference();
  const ref = useRef<HTMLElement>(null);

  // Cursor tilt (desktop pointers only).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-7, 7]), { stiffness: 80, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-1, 1], [5, -5]), { stiffness: 80, damping: 18 });
  const glowX = useTransform(mx, [-1, 1], ["44%", "56%"]);
  const glowY = useTransform(my, [-1, 1], ["40%", "50%"]);
  const glow = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(55% 50% at ${x} ${y}, rgba(64,103,177,0.42), rgba(64,103,177,0.08) 55%, transparent 75%)`);

  // Scroll away.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.86]);
  const stageOpacity = useTransform(scrollYProgress, [0.3, 1], [1, 0.2]);

  const words = m.name.split(" ");

  return (
    <section
      ref={ref}
      aria-labelledby="detail-title"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#f3f6fb] text-navy dark:bg-[#0b1322]"
    >
      {/* light */}
      <motion.div aria-hidden="true" style={{ background: reduce ? undefined : glow }} className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_50%_at_50%_45%,rgba(64,103,177,0.42),transparent_75%)] opacity-45 dark:opacity-100" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(255,255,255,0.9),transparent_60%)] dark:bg-[radial-gradient(120%_80%_at_50%_100%,rgba(5,9,18,0.9),transparent_60%)]" />

      {/* meta row */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        className="relative z-10 mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 pt-[92px] text-xs md:px-10 md:pt-[128px]"
      >
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-navy/60">
          <Link href="/products" className="hover:text-navy">
            Products
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          {crumb ? (
            <>
              <Link href={`/products/${id}`} className="hover:text-navy">
                {m.name}
              </Link>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span aria-current="page" className="text-navy/90">
                {crumb}
              </span>
            </>
          ) : (
            <span aria-current="page" className="text-navy/90">
              {m.name}
            </span>
          )}
        </nav>
        <p className="font-medium uppercase tracking-[0.08em] text-navy/60 max-sm:hidden">
          {m.role}
        </p>
      </motion.div>

      {/* the model */}
      <motion.div
        style={reduce ? undefined : { scale: stageScale, opacity: stageOpacity }}
        className="relative h-[52svh] min-h-[300px] w-full [perspective:1400px] lg:absolute lg:inset-x-0 lg:top-[10%] lg:h-[58%]"
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.92, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.4, delay: 0.15, ease: EASE }}
          style={reduce ? undefined : { rotateX, rotateY }}
          className="absolute inset-0"
        >
          <ModelStage id={id} label={`3D model of ${m.name}. Drag to turn it.`} className="size-full" />
        </motion.div>
      </motion.div>

      {/* type */}
      <motion.div
        style={reduce ? undefined : { y: textY, opacity: textOpacity }}
        className="relative z-10 mx-auto mt-auto grid w-full max-w-[1600px] gap-8 px-5 pb-10 md:px-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:pb-14"
      >
        <h1 id="detail-title" className="text-[clamp(3.25rem,10.5vw,9.5rem)] font-medium uppercase leading-[0.86] tracking-[-0.035em]">
          {words.map((w, i) => (
            <span key={w} className="block overflow-hidden pb-[0.04em]">
              <motion.span
                className="block"
                initial={reduce ? false : { y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.1, delay: 0.35 + i * 0.12, ease: EASE }}
              >
                {w}
                {/* keeps the words apart for screen readers and copy-paste */}
                {i < words.length - 1 ? " " : null}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          className="max-w-md lg:justify-self-end"
        >
          <p className="text-[15px] leading-relaxed text-navy/70">{m.value}</p>
          <div className="mt-6 flex items-baseline justify-between border-t border-navy/15 pt-4">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-navy/50">Price</span>
            <span className="text-xl font-medium tabular-nums">
              {m.price === null ? <span className="text-sm font-normal text-navy/60">On request</span> : formatUsd(m.price)}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <AddToCart id={id} className="flex-1 shadow-[0_14px_34px_-14px_rgba(64,103,177,0.95)]" />
            <Link
              href="/products#compare"
              className="inline-flex h-12 items-center justify-center rounded-full border border-navy/20 px-6 text-sm font-medium text-navy hover:border-navy/50"
            >
              Compare models
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.a
        href={next}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-navy/50 hover:text-navy lg:flex"
      >
        [ Scroll to explore ]
        <span aria-hidden="true" className="relative h-6 w-px overflow-hidden bg-navy/15">
          {!reduce && (
            <motion.span
              className="absolute inset-x-0 top-0 h-2 bg-navy/80"
              animate={{ y: [-8, 24] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </span>
      </motion.a>
    </section>
  );
}
