import type { StaticImageData } from "next/image";
import xp from "../../public/images/site/ring/xp.webp";
import mp from "../../public/images/site/ring/mp.webp";
import lt from "../../public/images/site/ring/lt.webp";
import ch from "../../public/images/site/ring/ch.webp";
import aurora from "../../public/images/site/ring/aurora.webp";
import monarch from "../../public/images/site/ring/monarch.webp";
import founder from "../../public/images/site/ring/founder.webp";
import simplestill from "../../public/images/site/ring/simplestill.webp";
import kingGuard from "../../public/images/site/ring/king-guard.webp";
import reishi from "../../public/images/site/ring/reishi.webp";
import relaxing from "../../public/images/site/ring/relaxing.webp";
import liquidAssets from "../../public/images/site/books/featured/liquid-assets.webp";
import greatKing from "../../public/images/site/books/featured/the-great-king.webp";
import treintaDias from "../../public/images/site/books/featured/30-dias.webp";

/**
 * The hero ring: one card per product the site presents, all in the same studio style.
 * Product shots are trimmed copies in public/images/site/ring (made from the product photos
 * used across the site); books show their covers.
 * - brand sets the card's accent and surface: AirGuard, King Hydrogen, Arcane Herb, Orrington Publishing.
 */
export type RingBrand = "airguard" | "king-hydrogen" | "arcane-herb" | "books";

export type RingCard = {
  id: string;
  brand: RingBrand;
  src: StaticImageData;
  title: string;
  /** A short line under the name (from the product menu). */
  note: string;
  href: string;
};

export const ringBrandLabel: Record<RingBrand, string> = {
  airguard: "AirGuard",
  "king-hydrogen": "King Hydrogen",
  "arcane-herb": "Arcane Herb",
  books: "Orrington Publishing",
};

export const ringCards: RingCard[] = [
  { id: "xp", brand: "airguard", src: xp, title: "AirGuard™ XP", note: "Flagship", href: "/products/xp" },
  { id: "aurora", brand: "king-hydrogen", src: aurora, title: "Aurora Edition", note: "Illuminated glass", href: "/#aurora-3d" },
  { id: "liquid-assets", brand: "books", src: liquidAssets, title: "Liquid Assets", note: "Dr. James Orrington", href: "/#book-store" },
  { id: "reishi", brand: "arcane-herb", src: reishi, title: "Reishi Tonic", note: "Herbal blend · 7 sachets", href: "/#arcane-herbs" },
  { id: "mp", brand: "airguard", src: mp, title: "AirGuard™ MP", note: "Everyday operatory", href: "/products/mp" },
  { id: "monarch", brand: "king-hydrogen", src: monarch, title: "The Monarch", note: "Full-spectrum flagship", href: "/#aurora-3d" },
  { id: "lt", brand: "airguard", src: lt, title: "AirGuard™ LT", note: "Lightweight", href: "/products/lt" },
  { id: "founder", brand: "king-hydrogen", src: founder, title: "Founder Edition", note: "The original numbered run", href: "/#aurora-3d" },
  { id: "great-king", brand: "books", src: greatKing, title: "The Great King", note: "Special edition", href: "/#book-store" },
  { id: "ch", brand: "airguard", src: ch, title: "AirGuard™ CH", note: "Compact", href: "/products/ch" },
  { id: "simplestill", brand: "king-hydrogen", src: simplestill, title: "SimpleStill", note: "Water distillation", href: "/#aurora-3d" },
  { id: "relaxing", brand: "arcane-herb", src: relaxing, title: "Relaxing", note: "Herbal blend · 7 sachets", href: "/#arcane-herbs" },
  { id: "king-guard", brand: "king-hydrogen", src: kingGuard, title: "King Guard", note: "Demo render", href: "/#aurora-3d" },
  { id: "30-dias", brand: "books", src: treintaDias, title: "30 Días", note: "Edición en español", href: "/#book-store" },
];
