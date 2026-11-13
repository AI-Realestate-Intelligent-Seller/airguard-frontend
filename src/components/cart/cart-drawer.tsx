"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronsRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { cart, cartCount, cartTotal, formatUsd, useCart } from "@/lib/cart";
import { useMotionPreference } from "@/hooks/use-motion-preference";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The cart, sliding in from the right. Opens when something is added or the header cart is
 * clicked; the minimize button, the backdrop or Escape close it. There is no online checkout
 * yet, so "Proceed to checkout" leads to the purchase enquiry.
 */
export function CartDrawer() {
  const { items, open } = useCart();
  const reduce = useMotionPreference();
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = cartCount(items);
  const { total, unpriced } = cartTotal(items);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.close();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100">
          <motion.button
            type="button"
            aria-label="Close cart"
            tabIndex={-1}
            onClick={cart.close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 cursor-default bg-[#172236]/35 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.55, ease: EASE }}
            className="absolute inset-y-0 right-0 flex w-full max-w-105 flex-col border-l border-border bg-background shadow-[-30px_0_60px_-30px_rgba(23,34,54,0.45)]"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <ShoppingCart className="size-5 text-brand-500" aria-hidden="true" />
                <h2 className="text-lg font-medium text-navy">Your cart</h2>
                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">{count}</span>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={cart.close}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-navy hover:border-brand-500 hover:text-brand-500 focus-visible:outline-2 focus-visible:outline-brand-400"
              >
                Minimize <ChevronsRight className="size-4" aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6">
              {items.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <ShoppingCart className="mx-auto size-10 text-navy/20" aria-hidden="true" />
                    <p className="mt-3 text-sm text-muted-foreground">Your cart is empty.</p>
                  </div>
                </div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.li
                        key={i.id}
                        layout={!reduce}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 border-b border-border py-5"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/70 dark:bg-white/5">
                          {i.image && (
                            // eslint-disable-next-line @next/next/no-img-element -- small cart thumbnail from an already-optimized static import
                            <img src={i.image} alt="" className="absolute inset-0 size-full object-contain p-2" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-navy">{i.name}</p>
                              {i.note && <p className="text-xs text-muted-foreground">{i.note}</p>}
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${i.name}`}
                              onClick={() => cart.remove(i.id)}
                              className="grid size-8 shrink-0 place-items-center rounded-full text-navy/50 hover:bg-secondary hover:text-navy"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                            <div className="inline-flex items-center rounded-full border border-border">
                              <button
                                type="button"
                                aria-label={`One less ${i.name}`}
                                onClick={() => cart.setQty(i.id, i.qty - 1)}
                                className="grid size-8 place-items-center rounded-full text-navy hover:text-brand-500"
                              >
                                <Minus className="size-3.5" aria-hidden="true" />
                              </button>
                              <span className="w-6 text-center text-sm tabular-nums text-navy" aria-label={`Quantity ${i.qty}`}>
                                {i.qty}
                              </span>
                              <button
                                type="button"
                                aria-label={`One more ${i.name}`}
                                onClick={() => cart.setQty(i.id, i.qty + 1)}
                                className="grid size-8 place-items-center rounded-full text-navy hover:text-brand-500"
                              >
                                <Plus className="size-3.5" aria-hidden="true" />
                              </button>
                            </div>
                            <p className="text-sm font-medium tabular-nums text-navy">
                              {i.price === null ? <span className="text-xs font-normal text-muted-foreground">Price on request</span> : formatUsd(i.price * i.qty)}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-border px-6 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-medium tabular-nums text-navy">
                    {total === 0 && unpriced ? <span className="text-base text-muted-foreground">On request</span> : formatUsd(total)}
                  </span>
                </div>
                {unpriced && total > 0 && <p className="mt-1 text-xs text-muted-foreground">Items priced on request are quoted separately.</p>}
                <Link
                  href="/contact"
                  onClick={cart.close}
                  className="group mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Proceed to checkout
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
