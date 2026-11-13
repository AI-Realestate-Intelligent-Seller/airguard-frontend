"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useMotionPreference as useReducedMotion } from "@/hooks/use-motion-preference";
import { ChevronDown, Menu, ShoppingCart, X } from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { headerNav } from "@/data/nav";
import { ProductsMenu } from "@/components/layout/products-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { productsMenu } from "@/data/products-menu";
import { cart, cartCount, useCart } from "@/lib/cart";
import logo from "../../../public/images/brand/airguard-logo-blue.png";
import logoLight from "../../../public/images/brand/airguard-logo-white.png";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const count = cartCount(useCart().items);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 32);
  });

  // While the mobile menu is open: lock the page behind it, close on Escape,
  // and close if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => desktop.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 -mb-[72px] isolate text-navy transition-[height,background-color,box-shadow] duration-300 ease-out md:-mb-[108px]",
        scrolled
          ? "h-[60px] md:h-[72px] bg-white/90 shadow-[0_10px_30px_-18px_rgba(23,34,54,0.35)] backdrop-blur-md"
          : "h-[72px] md:h-[108px] bg-transparent",
        open && "bg-white md:bg-transparent"
      )}
    >
      <Container className="flex h-full items-center justify-between gap-4">
        <Link href="/" className="relative flex items-center gap-2.5 shrink-0">
          <motion.div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full blur-lg"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklch, #4067b1 22%, transparent), transparent 70%)",
            }}
            animate={shouldReduceMotion ? undefined : { opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Blue logo in light mode, the white one in dark mode */}
          <Image
            src={logo}
            alt="AirGuard"
            className={cn(
              "w-auto transition-[height] duration-300 ease-out dark:hidden",
              scrolled ? "h-10 md:h-12" : "h-14 md:h-[84px]"
            )}
            priority
          />
          <Image
            src={logoLight}
            alt="AirGuard"
            className={cn(
              "hidden w-auto transition-[height] duration-300 ease-out dark:block",
              scrolled ? "h-10 md:h-12" : "h-14 md:h-[84px]"
            )}
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <ProductsMenu />
          {headerNav
            .filter((item) => item.label !== "Products")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-navy/80 transition-colors hover:text-brand-500"
              >
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
            onClick={cart.open}
            className="relative inline-flex rounded-md p-2 text-navy/80 transition-colors hover:bg-brand-50 hover:text-brand-500"
          >
            <ShoppingCart className="size-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  aria-hidden="true"
                  initial={shouldReduceMotion ? false : { scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold tabular-nums text-white ring-2 ring-background"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <Link
            href="/contact"
            className={cn(
              buttonVariants(),
              "hidden sm:inline-flex hover:bg-brand-600"
            )}
          >
            Donate Now
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded-md p-2 text-navy hover:bg-brand-50"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            // Fills the screen under the header and scrolls on its own, so long
            // product lists stay reachable instead of being clipped by the
            // fixed-height sticky header.
            className={cn(
              "md:hidden absolute inset-x-0 top-full overflow-y-auto overscroll-contain bg-brand-600 shadow-lg",
              scrolled ? "h-[calc(100dvh-60px)]" : "h-[calc(100dvh-72px)]"
            )}
          >
            <MobileMenuContent onNavigate={() => setOpen(false)} />
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Height-animated disclosure panel shared by both accordion levels. */
function Collapse({ open, id, children }: { open: boolean; id: string; children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Mobile menu: Products → brand → that brand's products, one level at a time.
 * Only one brand is expanded at once so the list stays short.
 */
function MobileMenuContent({ onNavigate }: { onNavigate: () => void }) {
  const [productsOpen, setProductsOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState<string | null>(null);

  const rowClass =
    "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-base text-white/90 transition-colors hover:bg-white/10 hover:text-white";

  return (
    <Container className="flex flex-col gap-1 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
      {/* Level 1: Products */}
      <button
        type="button"
        aria-expanded={productsOpen}
        aria-controls="mobile-products"
        onClick={() => {
          setProductsOpen((v) => !v);
          setBrandOpen(null);
        }}
        className={cn(rowClass, productsOpen && "bg-white/[0.06] text-white")}
      >
        <span className="font-medium">Products</span>
        <ChevronDown className={cn("size-5 text-white/60 transition-transform duration-200", productsOpen && "rotate-180")} />
      </button>

      <Collapse open={productsOpen} id="mobile-products">
        <ul className="ml-3 mt-1 mb-2 flex flex-col gap-0.5 border-l border-white/15 pl-2">
          {productsMenu.map((col) => {
            const expanded = brandOpen === col.id;
            const panelId = `mobile-brand-${col.id}`;
            return (
              <li key={col.id}>
                {/* Level 2: brand */}
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setBrandOpen(expanded ? null : col.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/10",
                    expanded ? "bg-white/[0.06] font-semibold text-white" : "text-white/80"
                  )}
                >
                  <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: col.accent }} />
                  <span className="flex-1">{col.brand}</span>
                  <span aria-hidden className="text-[11px] tabular-nums text-white/40">{col.items.length}</span>
                  <ChevronDown className={cn("size-4 text-white/50 transition-transform duration-200", expanded && "rotate-180")} />
                </button>

                {/* Level 3: that brand's products */}
                <Collapse open={expanded} id={panelId}>
                  <ul className="mb-2 mt-0.5 flex flex-col pl-7">
                    {col.items.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className="block rounded-md px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={col.overview.href}
                        onClick={onNavigate}
                        className="mt-0.5 block rounded-md px-3 py-2 text-xs font-medium hover:bg-white/10"
                        style={{ color: col.accent }}
                      >
                        {col.overview.label} →
                      </Link>
                    </li>
                  </ul>
                </Collapse>
              </li>
            );
          })}
        </ul>
      </Collapse>

      {headerNav
        .filter((item) => item.label !== "Products")
        .map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={cn(rowClass, "font-medium")}>
            {item.label}
          </Link>
        ))}

      <Link
        href="/contact"
        onClick={onNavigate}
        className={cn(buttonVariants({ size: "lg" }), "mt-4 bg-white text-brand-500 hover:bg-white/90")}
      >
        Donate Now
      </Link>
    </Container>
  );
}
