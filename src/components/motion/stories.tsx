"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ParticleBridge, type Caption } from "@/components/motion/particle-bridge";
import { useT } from "@/i18n/locale";

/*
 * The two particle stories on the home page. Captions describe what is on screen; the only
 * product statements are the sites' own lines (taglines, "herbs kept whole", the pairing line).
 */

const GENESIS: Caption[] = [
  { kicker: "King Hydrogen", title: "It starts small.", line: "Hydrogen and oxygen: two elements." },
  { kicker: "King Hydrogen", title: "Two become one.", line: "Two hydrogens and one oxygen make a water molecule." },
  { kicker: "King Hydrogen", title: "The chemistry of life.", line: "Water is part of every living thing." },
  { kicker: "King Hydrogen", title: "Into water.", line: "Molecule by molecule, a single drop." },
  { kicker: "King Hydrogen", title: "Don't get watered down.", line: "Programmable hydrogen water." }, // the drop falls into King Hydrogen
];

const INFUSION: Caption[] = [
  { kicker: "Arcane Herb", title: "Pure water.", line: "From the King Hydrogen jar, into the cup." },
  { kicker: "Arcane Herb", title: "Botanicals, precisely blended.", line: "Herbs kept whole, never powdered." },
  { kicker: "Arcane Herb", title: "Steeped together.", line: "Arcane Herb blends can be prepared with King Hydrogen water." },
  { kicker: "Arcane Herb", title: "Small batch, carefully made.", line: "Pure herbs, pure healing." },
  { kicker: "Better together", title: "From water to herbs." },
];

/** Before King Hydrogen: atoms → water molecules → DNA → a drop that strikes the water. */
export function GenesisStory() {
  // between AirGuard and King Hydrogen, which share one blue-white (and one navy in dark mode)
  return <ParticleBridge id="genesis" kind="genesis" carryDrop captions={GENESIS} glow="#7fb6ff" bg={{ light: ["#e4ebf6", "#e4ebf6"], dark: ["#0b1220", "#0a1222"] }} />;
}

/** Before Arcane Herb: a water surface → a whirlpool → steeping → a bloom → a drop striking the tea. */
export function InfusionStory() {
  const t = useT();
  return (
    <ParticleBridge
      id="relay"
      kind="infusion"
      captions={INFUSION}
      glow="#a6d6b4"
      hold={1.8}
      // from King Hydrogen's blue-white into Arcane Herb's cream (navy into warm dark in dark mode)
      bg={{ light: ["#e4ebf6", "#ebe6dc"], dark: ["#0a1222", "#1c1a17"] }}
      footer={
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/contact?product=king-hydrogen" data-cta="primary" className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-medium text-white hover:bg-brand-500 dark:bg-[#fff] dark:text-[#0a1424] dark:hover:bg-[#e8f5ec]">
            {t("Ask about pairing")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <Link href="/#arcane-herbs" className="inline-flex h-11 items-center rounded-full border border-navy/25 px-5 text-sm font-medium text-navy hover:border-navy/60 dark:border-white/25 dark:text-white dark:hover:border-white/60">
            {t("Browse blends")}
          </Link>
        </div>
      }
    />
  );
}
