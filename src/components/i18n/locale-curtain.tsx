"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { commitLocale, localeMeta, usePendingLocale, type Locale } from "@/i18n/locale";
import { EASE_IN_OUT } from "@/lib/motion";

/*
 * The language change: a glass curtain sweeps across the page in the new language's reading
 * direction (left → right for English and Spanish, right → left for Arabic), shows the language's
 * name and a greeting, switches every string while the page is hidden, then carries on across and
 * off the other side.
 */
export function LocaleCurtain() {
  const pending = usePendingLocale();
  const [target, setTarget] = useState<Locale | null>(null);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (!pending) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starting the curtain for a new request
    setTarget(pending);
    setPhase("in");
  }, [pending]);

  if (!target) return null;
  const meta = localeMeta(target);
  const rtl = meta.dir === "rtl";
  // clip-path edges: the curtain grows from the leading side, then leaves through the trailing side
  const hidden = rtl ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
  const covered = "inset(0 0 0 0)";
  const gone = rtl ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";

  return (
    <AnimatePresence>
      <motion.div
        key={target}
        aria-hidden="true"
        initial={{ clipPath: hidden }}
        animate={{ clipPath: phase === "in" ? covered : gone }}
        transition={{ duration: phase === "in" ? 0.6 : 0.7, ease: EASE_IN_OUT }}
        onAnimationComplete={() => {
          if (phase === "in") {
            setTimeout(() => {
              commitLocale(target);
              setPhase("out");
            }, 420);
          } else {
            setTarget(null);
          }
        }}
        dir={meta.dir}
        data-no-translate
        className="fixed inset-0 z-[300] grid place-items-center overflow-hidden bg-[#0a1424]/80 backdrop-blur-2xl"
      >
        {/* aurora light behind the glass */}
        <div className="absolute -left-1/4 top-1/4 size-[60vmax] rounded-full bg-[#4067b1]/50 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 size-[50vmax] rounded-full bg-[#7fd1e8]/30 blur-[120px]" />
        <div className="relative text-center text-white">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: phase === "in" ? 1 : 0, y: 0 }}
            transition={{ duration: 0.5, delay: phase === "in" ? 0.25 : 0 }}
            className="text-sm font-medium uppercase tracking-[0.08em] text-[#a9c1ec]"
          >
            {meta.hello}
          </motion.p>
          <p className="mt-3 text-[clamp(3rem,12vw,8rem)] font-semibold leading-none tracking-tight">
            {(rtl ? [meta.label] : [...meta.label]).map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: "0.4em", filter: "blur(10px)" }}
                animate={phase === "in" ? { opacity: 1, y: "0em", filter: "blur(0px)" } : { opacity: 0, y: "-0.3em", filter: "blur(8px)" }}
                transition={{ duration: 0.55, delay: phase === "in" ? 0.2 + i * 0.04 : i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {ch}
              </motion.span>
            ))}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
