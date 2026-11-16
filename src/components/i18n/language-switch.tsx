"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Check, Globe } from "lucide-react";
import { LOCALES, localeMeta, requestLocale, useLocale, useT } from "@/i18n/locale";
import { cn } from "@/lib/utils";

/** Header language picker: a globe with the current code; the list drops open with the choices. */
export function LanguageSwitch() {
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative" data-no-translate>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("Choose a language")}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm text-navy/80 transition-colors hover:bg-brand-50 hover:text-brand-500"
      >
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="grid">
          <Globe className="size-[18px]" aria-hidden="true" />
        </motion.span>
        <span className="min-w-4 text-xs font-semibold">{localeMeta(locale).short}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t("Language")}
            initial={{ opacity: 0, y: -8, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute end-0 top-full z-50 mt-2 w-44 origin-top overflow-hidden rounded-2xl border border-navy/10 bg-white/90 p-1.5 shadow-[0_24px_50px_-24px_rgba(23,34,54,.55)] backdrop-blur-xl dark:border-white/10 dark:bg-[#101b30]/90"
          >
            {LOCALES.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l.id === locale}
                  lang={l.id}
                  onClick={() => {
                    setOpen(false);
                    requestLocale(l.id);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-sm transition-colors",
                    l.id === locale ? "bg-brand-500 text-white" : "text-navy hover:bg-brand-50"
                  )}
                >
                  <span>{l.label}</span>
                  {l.id === locale ? <Check className="size-4" aria-hidden="true" /> : <span className="text-[11px] text-muted-foreground">{l.short}</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Mobile menu version: a three-way segmented control. */
export function LanguageSegments() {
  const locale = useLocale();
  const t = useT();
  return (
    <LayoutGroup id="lang-seg">
      <div data-no-translate role="radiogroup" aria-label={t("Language")} className="grid grid-cols-3 gap-1 rounded-full bg-white/10 p-1">
        {LOCALES.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={l.id === locale}
            lang={l.id}
            onClick={() => requestLocale(l.id)}
            className={cn("relative h-10 rounded-full text-sm font-medium transition-colors", l.id === locale ? "text-navy" : "text-white/75 hover:text-white")}
          >
            {l.id === locale && <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-full bg-[#fff]" transition={{ duration: 0.3 }} />}
            <span className="relative">{l.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
