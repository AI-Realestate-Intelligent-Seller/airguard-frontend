import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Droplets, Package } from "lucide-react";
import type { StaticImageData } from "next/image";
import productXp from "../../public/images/site/airguard/product-xp.webp";
import productMp from "../../public/images/site/airguard/product-mp.webp";
import productLt from "../../public/images/site/airguard/product-lt.webp";
import productCh from "../../public/images/site/airguard/product-ch.webp";
import simplestill from "../../public/images/site/king-hydrogen/simplestill.webp";
import aurora from "../../public/images/site/king-hydrogen/aurora.webp";
import founder from "../../public/images/site/king-hydrogen/founder.webp";
import monarch from "../../public/images/site/king-hydrogen/monarch.webp";
import { books } from "./books";

export type HeroProduct =
  | { kind: "image"; src: StaticImageData; label: string }
  | { kind: "bottle"; color: string; label: string };

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  titleAccent?: string;
  tagline: string;
  body: string;
  cta: { label: string; href: string };
  /** Full-bleed photo for this slide, if the brand has one. */
  photo?: StaticImageData;
  /** Backdrop wash used behind (or instead of) the photo. */
  wash: string;
  /** Tint for the eyebrow and progress rail. */
  accent: string;
  /** Brand-specific trust signals, shown under the CTA. */
  chips?: { icon: LucideIcon; label: string }[];
  products: HeroProduct[];
};

export const heroSlides: HeroSlide[] = [
  {
    id: "king-hydrogen",
    eyebrow: "King Hydrogen",
    title: "Don't get",
    titleAccent: "watered down",
    tagline: "Programmable hydrogen water.",
    body:
      "A distillery for the counter — Bluetooth-controlled, engraved glass, and four editions from the essential SimpleStill to the full-spectrum Monarch.",
    cta: { label: "Shop now", href: "#aurora-3d" },
    wash: "linear-gradient(100deg, #060b17 6%, #0d1b3a 48%, #10306b 100%)",
    accent: "#5ec8ff",
    products: [
      { kind: "image", src: monarch, label: "The Monarch" },
      { kind: "image", src: aurora, label: "Aurora Edition" },
      { kind: "image", src: founder, label: "Founder Edition" },
      { kind: "image", src: simplestill, label: "SimpleStill" },
    ],
  },
  {
    id: "airguard",
    eyebrow: "Dentistry",
    title: "Innovative Chairside",
    titleAccent: "Protection",
    tagline: "Advancing Dentistry & Clean Air.",
    body:
      "Extra-oral suction and ergonomic barrier systems engineered for modern dentistry — working right at the source to protect clinicians, staff, and patients while elevating whole-practice wellness chairside.",
    cta: { label: "Shop now", href: "#airguard-3d" },
    wash: "radial-gradient(ellipse at 76% 48%, #214c62 0%, #112c43 38%, #080f20 80%)",
    accent: "#8fb3ef",
    chips: [
      { icon: BadgeCheck, label: "FDA Registered" },
      { icon: Package, label: "Modern Dentistry Standard" },
      { icon: Droplets, label: "Chairside Clean-Air Wellness" },
    ],
    products: [
      { kind: "image", src: productXp, label: "AirGuard XP" },
      { kind: "image", src: productMp, label: "AirGuard MP" },
      { kind: "image", src: productLt, label: "AirGuard LT" },
      { kind: "image", src: productCh, label: "AirGuard CH" },
    ],
  },
  {
    id: "arcane-herb",
    eyebrow: "Arcane Herb",
    title: "Small batch,",
    titleAccent: "carefully made",
    tagline: "Botanicals, precisely blended.",
    body:
      "Four botanical blends, sourced deliberately and blended in small runs. Product photography for the line is on its way.",
    cta: { label: "Shop now", href: "#arcane-herbs" },
    wash: "linear-gradient(100deg, #10201a 6%, #1b3a2c 48%, #2d5a42 100%)",
    accent: "#9ed4ae",
    products: [
      { kind: "bottle", color: "#7c9885", label: "Calm" },
      { kind: "bottle", color: "#b08a3e", label: "Focus" },
      { kind: "bottle", color: "#9c6b98", label: "Restore" },
      { kind: "bottle", color: "#5c8a8a", label: "Immunity" },
    ],
  },
];

heroSlides.push({
  id: "book-store",
  eyebrow: "Orrington Publishing",
  title: "Words worth",
  titleAccent: "keeping.",
  tagline: "From the bench to the page.",
  body:
    "Titles from Dr. James Orrington — the dentist behind AirGuard and King Hydrogen — on water, wellbeing and building something that lasts.",
  cta: { label: "Visit the Book Store", href: "#book-store" },
  wash: "linear-gradient(100deg, #1a1206 6%, #33240f 48%, #5a4120 100%)",
  accent: "#e0c08a",
  products: books.map((b) => ({ kind: "image" as const, src: b.cover, label: b.shortTitle })),
});

export const SLIDE_MS = 7500;
