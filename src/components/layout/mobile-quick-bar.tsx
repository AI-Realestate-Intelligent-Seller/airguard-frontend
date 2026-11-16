"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MessageSquareText, Phone, ShoppingCart } from "lucide-react";
import { modelById, salesPhone } from "@/data/airguard-models";
import { BOOK_STORE_URL } from "@/data/book-store";
import { flyToCart } from "@/lib/fly-to-cart";
import { useMotionPreference } from "@/hooks/use-motion-preference";

/*
 * Phones only: a slim action bar pinned to the bottom of the screen, so a way to buy or ask is
 * always one thumb-tap away. It follows what's on screen: on the home page it changes with the
 * brand section in view (AirGuard → shop / quote, Arcane Herb and King Hydrogen → ask / call,
 * Book Store → the store); elsewhere it offers a quote and a call. It waits until the visitor has
 * scrolled past the first screen, and steps aside over the footer, the home page's own contact
 * section and the contact page (which already are the next step).
 */

type Action = { label: string; href?: string; onClick?: (from: Element) => void; external?: boolean; icon: "cart" | "ask" | "call" };
type Context = { title: string; note: string; primary: Action; secondary: Action };

const quote = (product: string, type?: string) =>
  `/contact?product=${product}${type ? `&type=${encodeURIComponent(type)}` : ""}`;

const call: Action = { label: "Call", href: salesPhone.href, icon: "call" };

const xp = modelById.xp;
const AIRGUARD: Context = {
  title: xp.name,
  note: "Chairside protection",
  primary: {
    label: "Shop now",
    icon: "cart",
    onClick: (from) => flyToCart({ id: `airguard-${xp.id}`, name: xp.name, note: xp.role, price: xp.price, image: xp.image.src }, from),
  },
  secondary: { label: "Quote", href: quote("airguard", xp.name), icon: "ask" },
};

/** Home page sections → what the bar offers while each is on screen. */
const HOME: Record<string, Context | null> = {
  discover: AIRGUARD,
  journey: AIRGUARD,
  "our-world": AIRGUARD,
  "airguard-3d": AIRGUARD,
  "arcane-herbs": {
    title: "Arcane Herb",
    note: "Botanical blends",
    primary: { label: "Ask about a blend", href: quote("arcane-herb"), icon: "ask" },
    secondary: call,
  },
  "aurora-3d": {
    title: "King Hydrogen",
    note: "Hydrogen water",
    primary: { label: "Enquire", href: quote("king-hydrogen"), icon: "ask" },
    secondary: call,
  },
  "book-store": {
    title: "Book Store",
    note: "Orrington Publishing",
    primary: { label: "Visit the store", href: BOOK_STORE_URL, external: true, icon: "cart" },
    secondary: { label: "Ask", href: quote("book-store"), icon: "ask" },
  },
  // The contact section is already the next step.
  contact: null,
};

const ELSEWHERE: Context = {
  title: "AirGuard™",
  note: "Questions or orders",
  primary: { label: "Get a quote", href: quote("airguard"), icon: "ask" },
  secondary: call,
};

/** Detail pages (/products/xp …): quote for that model. */
function contextFor(pathname: string): Context | null {
  if (pathname.startsWith("/contact")) return null;
  const model = pathname.match(/^\/products\/(xp|mp|lt|ch)$/)?.[1] as keyof typeof modelById | undefined;
  if (model) {
    const m = modelById[model];
    return {
      title: m.name,
      note: m.price === null ? "Price on request" : "Order or ask",
      primary: { label: "Get a quote", href: quote("airguard", m.name), icon: "ask" },
      secondary: call,
    };
  }
  return ELSEWHERE;
}

const Icon = ({ name }: { name: Action["icon"] }) =>
  name === "cart" ? (
    <ShoppingCart className="size-4" aria-hidden="true" />
  ) : name === "call" ? (
    <Phone className="size-4" aria-hidden="true" />
  ) : (
    <MessageSquareText className="size-4" aria-hidden="true" />
  );

function ActionButton({ action, primary }: { action: Action; primary?: boolean }) {
  const cls = primary
    ? "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-500 px-4 text-sm font-medium text-white shadow-[0_10px_24px_-12px_rgba(64,103,177,0.85)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
    : "inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-navy/15 px-3.5 text-sm font-medium text-navy active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 dark:border-white/15 dark:text-white";
  const body = (
    <>
      <Icon name={action.icon} />
      {action.label}
    </>
  );
  if (action.onClick) {
    return (
      <button type="button" onClick={(e) => action.onClick?.(e.currentTarget)} data-cta={primary ? "primary" : ""} className={cls}>
        {body}
      </button>
    );
  }
  if (action.external || action.href?.startsWith("tel:")) {
    return (
      <a href={action.href} data-cta={primary ? "primary" : ""} className={cls} {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {body}
      </a>
    );
  }
  return (
    <Link href={action.href ?? "/contact"} data-cta={primary ? "primary" : ""} className={cls}>
      {body}
    </Link>
  );
}

export function MobileQuickBar() {
  const pathname = usePathname();
  const reduce = useMotionPreference();
  const isHome = pathname === "/";
  const [section, setSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [footerInView, setFooterInView] = useState(false);

  // Shown once the visitor has scrolled past most of the first screen.
  useEffect(() => {
    const read = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [pathname]);

  // Steps aside over the footer.
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setFooterInView(e.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, [pathname]);

  // Home page: which brand section holds the middle of the screen.
  useEffect(() => {
    if (!isHome) return;
    const els = Object.keys(HOME)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setSection(e.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  const ctx = isHome ? (section ? HOME[section] : AIRGUARD) : contextFor(pathname);
  const show = !!ctx && scrolled && !footerInView;

  return (
    <AnimatePresence>
      {show && ctx && (
        <motion.div
          key="quick-bar"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-40 md:hidden"
        >
          <div
            role="region"
            aria-label="Quick actions"
            className="flex items-center gap-2 rounded-full border border-navy/10 bg-white/90 py-1.5 pl-4 pr-1.5 shadow-[0_18px_40px_-18px_rgba(23,34,54,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-[#101b30]/90"
          >
            {/* Re-keyed per context so the new name fades in (no exit step, so it can't lag behind). */}
            <motion.div
              key={ctx.title}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="min-w-0 flex-1"
            >
              <p className="truncate text-sm font-medium leading-tight text-navy dark:text-white">{ctx.title}</p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">{ctx.note}</p>
            </motion.div>
            <ActionButton action={ctx.secondary} />
            <ActionButton action={ctx.primary} primary />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
