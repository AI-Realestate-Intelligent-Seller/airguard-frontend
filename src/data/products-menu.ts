import type { StaticImageData } from "next/image";
import productXp from "../../public/images/site/airguard/product-xp.webp";
import productMp from "../../public/images/site/airguard/product-mp.webp";
import productLt from "../../public/images/site/airguard/product-lt.webp";
import productCh from "../../public/images/site/airguard/product-ch.webp";
import simplestill from "../../public/images/site/king-hydrogen/simplestill.webp";
import founder from "../../public/images/site/king-hydrogen/founder.webp";
import aurora from "../../public/images/site/king-hydrogen/aurora.webp";
import monarch from "../../public/images/site/king-hydrogen/monarch.webp";
import { arcaneHerbsHref, arcaneHerbTeas, featuredArcaneHerbTeas } from "./arcane-herb-products";
import { books, bookStoreHref } from "./books";

export type MenuItem = {
  name: string;
  note: string;
  href: string;
  /** Omitted where no product shot exists yet; the menu falls back to a mark. */
  image?: StaticImageData;
};

export type MenuColumn = {
  id: string;
  brand: string;
  blurb: string;
  /** Column accent, used for the rule, hover wash and thumbnail ring. */
  accent: string;
  items: MenuItem[];
  overview: { label: string; href: string };
};

export const productsMenu: MenuColumn[] = [
  {
    id: "airguard",
    brand: "AirGuard™",
    blurb: "Chairside protection",
    accent: "#4067b1",
    overview: { label: "Overview & model comparison", href: "/products" },
    items: [
      { name: "AirGuard XP", note: "Flagship · interactive explorer", href: "/products/xp", image: productXp },
      { name: "AirGuard MP", note: "Mid-size, everyday operatory", href: "/products/mp", image: productMp },
      { name: "AirGuard LT", note: "Lightweight, easiest to mount", href: "/products/lt", image: productLt },
      { name: "AirGuard CH", note: "Compact, for tighter rooms", href: "/products/ch", image: productCh },
    ],
  },
  {
    id: "king-hydrogen",
    brand: "King Hydrogen",
    blurb: "Programmable hydrogen water",
    accent: "#2b7fb8",
    overview: { label: "Explore the range", href: "/#aurora-3d" },
    items: [
      { name: "SimpleStill", note: "Practical dental water distillation", href: "/#aurora-3d", image: simplestill },
      { name: "Founder Edition", note: "The original numbered run", href: "/#aurora-3d", image: founder },
      { name: "Aurora Edition", note: "Illuminated glass, engraved crest", href: "/#aurora-3d", image: aurora },
      { name: "The Monarch", note: "Full-spectrum flagship", href: "/#aurora-3d", image: monarch },
      // No product shot supplied yet — renders with the brand mark instead.
      { name: "King Guard", note: "Interactive door-state experience", href: "/#aurora-3d" },
    ],
  },
  {
    id: "arcane-herb",
    brand: "Arcane Herb",
    blurb: "Small-batch botanical infusions",
    accent: "#4f8a62",
    overview: { label: `All ${arcaneHerbTeas.length} blends`, href: arcaneHerbsHref },
    // Driven off the shared featured list so the menu can't drift from the catalogue.
    items: featuredArcaneHerbTeas.slice(0, 5).map((tea) => ({
      name: tea.name,
      note: tea.code,
      href: arcaneHerbsHref,
      image: tea.image,
    })),
  },
  {
    id: "book-store",
    brand: "Book Store",
    blurb: "Orrington Publishing titles",
    accent: "#a07a3c",
    overview: { label: "Visit the Book Store", href: bookStoreHref },
    items: books.map((b) => ({
      name: b.shortTitle,
      note: b.subtitle,
      href: b.href,
      image: b.cover,
    })),
  },
];
