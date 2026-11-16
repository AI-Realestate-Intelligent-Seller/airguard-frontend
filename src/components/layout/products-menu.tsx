"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ArrowRight, ChevronDown, ShieldCheck } from "lucide-react";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { Container } from "@/components/layout/container";
import { productsMenu } from "@/data/products-menu";
import { setMenuOpen } from "@/hooks/use-menu-open";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import { useT } from "@/i18n/locale";

/**
 * Products mega-menu: one column per brand, each listing its variants.
 *
 * "Products" itself links to /products. The menu opens on hover for pointer users and from the
 * chevron button for touch and keyboard. Products go to their detail pages; each family heading
 * and its button at the foot of the column open /products with that family selected. Escape closes it and returns focus to
 * the trigger; a close is deferred briefly on pointer-out so the diagonal
 * travel from the trigger down into the panel doesn't dismiss it.
 */
export function ProductsMenu({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => cancelClose(), []);

  // The hero's product art is animated, so the browser promotes it to its own
  // compositor layer mid-flight and it can paint over the menu for a few frames
  // even though the header sits above it in the stacking order. Rather than
  // fight that, the hero stage steps aside while the menu is open.
  useEffect(() => {
    setMenuOpen(open);
    return () => setMenuOpen(false);
  }, [open]);

  // Escape closes and hands focus back; clicking away closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const panel: Variants = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: -14, scale: 0.985, filter: "blur(6px)" },
    shown: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: shouldReduceMotion
        ? { duration: 0.15 }
        : { duration: 0.42, ease: EASE, staggerChildren: 0.07, delayChildren: 0.06 },
    },
    exit: shouldReduceMotion
      ? { opacity: 0, transition: { duration: 0.12 } }
      : { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.18 } },
  };

  const column: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    shown: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0.15 }
        : { duration: 0.45, ease: EASE, staggerChildren: 0.045, delayChildren: 0.05 },
    },
  };

  const row: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 },
    shown: { opacity: 1, x: 0, transition: { duration: 0.38, ease: EASE } },
  };

  return (
    <div
      ref={wrapRef}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        cancelClose();
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        scheduleClose();
      }}
    >
      {/* "Products" goes to the products page; hovering it (or the chevron, for touch and keyboard) opens the menu */}
      <div className="flex items-center">
        <Link
          href="/products"
          onClick={() => {
            setOpen(false);
            onNavigate?.();
          }}
          onFocus={cancelClose}
          className={cn("text-sm transition-colors hover:text-brand-500", open ? "text-brand-500" : "text-navy/80")}
        >
          {t("Products")}
        </Link>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={open ? t("Close the products menu") : t("Open the products menu")}
          onClick={() => setOpen((v) => !v)}
          className="-mr-1 grid size-7 cursor-pointer place-items-center rounded-full text-navy/60 transition-colors hover:bg-brand-50 hover:text-brand-500"
        >
          <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-x-0 top-full z-30 h-screen transform-gpu bg-[#172236]/25 backdrop-blur-[2px]"
          />
        )}
        {open && (
          <motion.div
            key="panel"
            variants={panel}
            initial="hidden"
            animate="shown"
            exit="exit"
            // Anchored to the header (which is sticky, so it is the containing
            // block) rather than the 70px trigger — and not `fixed`, because the
            // scrolled header's backdrop-filter would capture that anyway.
            // transform-gpu keeps this on its own compositor layer. Without it
            // the hero's animating art gets promoted mid-flight and can paint
            // over the menu for a frame or two before the compositor re-sorts.
            className="absolute inset-x-0 top-full z-40 origin-top pt-2 transform-gpu [will-change:transform,opacity]"
          >
            <Container>
              <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white/95 shadow-[0_32px_80px_-24px_rgba(23,34,54,.35)] backdrop-blur-xl">
                <div className="grid gap-px bg-brand-100 sm:grid-cols-2 lg:grid-cols-4">
                  {productsMenu.map((col) => (
                    <motion.div
                      key={col.id}
                      variants={column}
                      className="group/col relative bg-white p-6"
                    >
                      {/* Accent wash that lifts as the column is hovered */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/col:opacity-100"
                        style={{ background: `linear-gradient(180deg, ${col.accent}14, transparent 60%)` }}
                      />

                      {/* The family heading opens /products with this family selected */}
                      <Link
                        href={col.overview.href}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.();
                        }}
                        className="group/head relative block"
                      >
                        <span
                          aria-hidden
                          className="block h-0.5 w-8 rounded-full transition-all duration-500 group-hover/col:w-16"
                          style={{ backgroundColor: col.accent }}
                        />
                        <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-navy transition-colors group-hover/head:text-brand-500">
                          {col.brand}
                          <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover/head:translate-x-0 group-hover/head:opacity-100" aria-hidden />
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{t(col.blurb)}</span>
                      </Link>

                      <ul className="relative mt-5 space-y-1">
                        {col.items.map((item) => (
                          <motion.li key={item.name} variants={row}>
                            <Link
                              href={item.href}
                              onClick={() => {
                                setOpen(false);
                                onNavigate?.();
                              }}
                              className="group/row flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-brand-50"
                            >
                              <span
                                className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-50 ring-1 ring-inset ring-brand-100 transition-transform duration-300 group-hover/row:scale-105"
                                style={{ boxShadow: `inset 0 0 0 1px transparent` }}
                              >
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt=""
                                    className="size-full object-contain p-1"
                                    sizes="44px"
                                  />
                                ) : (
                                  <ShieldCheck
                                    className="size-5"
                                    style={{ color: col.accent }}
                                    strokeWidth={1.75}
                                  />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm text-navy/90 transition-colors group-hover/row:text-brand-500">
                                  {item.name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">{t(item.note)}</span>
                              </span>
                              <ArrowRight className="size-4 shrink-0 text-navy/25 transition-all duration-300 group-hover/row:translate-x-0.5 group-hover/row:text-brand-500" />
                            </Link>
                          </motion.li>
                        ))}
                      </ul>

                      <Link
                        href={col.overview.href}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.();
                        }}
                        className="group/ov relative mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:text-white"
                        style={{ color: col.accent, borderColor: `${col.accent}55`, ["--ov" as string]: col.accent }}
                      >
                        <span aria-hidden className="absolute inset-0 -z-0 scale-x-0 rounded-full bg-[var(--ov)] transition-transform duration-300 group-hover/ov:scale-x-100" style={{ transformOrigin: "left" }} />
                        <span className="relative">{t(col.overview.label, { n: col.overview.count ?? "" })}</span>
                        <ArrowRight className="relative size-3.5 transition-transform duration-300 group-hover/ov:translate-x-0.5" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
