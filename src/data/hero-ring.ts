import type { StaticImageData } from "next/image";
import heroDental from "../../public/images/site/airguard/chairside-dental.webp";
import featureAerosol from "../../public/images/site/airguard/feature-aerosol.webp";
import featureFit from "../../public/images/site/airguard/feature-fit.webp";
import featureInnovation from "../../public/images/site/airguard/feature-innovation.webp";
import teamPhoto from "../../public/images/site/contact/team-photo.webp";
import productXp from "../../public/images/site/airguard/product-xp.webp";
import productMp from "../../public/images/site/airguard/product-mp.webp";
import productLt from "../../public/images/site/airguard/product-lt.webp";
import productCh from "../../public/images/site/airguard/product-ch.webp";
import monarch from "../../public/images/site/king-hydrogen/monarch.webp";
import aurora from "../../public/images/site/king-hydrogen/aurora.webp";
import liquidAssets from "../../public/images/site/books/featured/liquid-assets.webp";
import drDemo from "../../public/images/site/about/dr-orrington-demo.webp";
import ltTesting from "../../public/images/site/about/lt-testing.webp";
import teaPack from "../../public/images/site/arcane-herb/tea-pack-body.webp";

/**
 * Card looks for the hero ring.
 * - photo:   full-bleed photo under a navy scrim
 * - product: AirGuard product on the light brand surface
 * - brand:   solid AirGuard blue with a headline
 * - night:   King Hydrogen's dark studio
 * - cover:   a book or pack on a warm surface
 */
export type RingVariant = "photo" | "product" | "brand" | "night" | "cover";

export type RingCard = {
  id: string;
  variant: RingVariant;
  src: StaticImageData;
  kicker: string;
  title: string;
  href: string;
};

export const ringCards: RingCard[] = [
  { id: "chairside", variant: "photo", src: heroDental, kicker: "Chairside", title: "Breathe easy", href: "#airguard-3d" },
  { id: "xp", variant: "product", src: productXp, kicker: "Flagship", title: "AirGuard™ XP", href: "#airguard-3d" },
  { id: "fda", variant: "brand", src: featureFit, kicker: "FDA Registered", title: "Protection at the source", href: "#airguard-3d" },
  { id: "monarch", variant: "night", src: monarch, kicker: "King Hydrogen", title: "The Monarch", href: "#aurora-3d" },
  { id: "aerosol", variant: "photo", src: featureAerosol, kicker: "Capture at the source", title: "Clean air, every patient", href: "#airguard-3d" },
  { id: "mp", variant: "product", src: productMp, kicker: "Everyday operatory", title: "AirGuard™ MP", href: "#airguard-3d" },
  { id: "demo", variant: "photo", src: drDemo, kicker: "Designed by a dentist", title: "Dr. James Orrington", href: "/about" },
  { id: "book", variant: "cover", src: liquidAssets, kicker: "Orrington Publishing", title: "Liquid Assets", href: "#book-store" },
  { id: "lt", variant: "product", src: productLt, kicker: "Lightweight", title: "AirGuard™ LT", href: "#airguard-3d" },
  { id: "innovation", variant: "brand", src: featureInnovation, kicker: "Innovation", title: "Advancing dentistry", href: "#airguard-3d" },
  { id: "testing", variant: "photo", src: ltTesting, kicker: "In practice", title: "Built for the chair", href: "#contact" },
  { id: "aurora", variant: "night", src: aurora, kicker: "King Hydrogen", title: "Aurora Edition", href: "#aurora-3d" },
  { id: "ch", variant: "product", src: productCh, kicker: "Compact", title: "AirGuard™ CH", href: "#airguard-3d" },
  { id: "team", variant: "photo", src: teamPhoto, kicker: "Trusted by clinicians", title: "Protect your team", href: "#contact" },
  { id: "herb", variant: "cover", src: teaPack, kicker: "Arcane Herb", title: "Small-batch botanicals", href: "#arcane-herbs" },
];
