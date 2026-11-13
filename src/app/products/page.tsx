import type { Metadata } from "next";
import { ProductRunway } from "@/components/products/product-runway";
import { ModelLadder } from "@/components/products/model-ladder";
// Hidden for now (2026-11-13): the XP opens in 3D in the hero instead.
// import { XpExplorer } from "@/components/products/xp-explorer";
import { CompareModels } from "@/components/products/compare-models";
// ProofSection (claims) is hidden for now.
import { FaqSection, ProductsCta } from "@/components/products/proof-faq-cta";
import { airguardModels, faqs } from "@/data/airguard-models";

export const metadata: Metadata = {
  title: "AirGuard Products | XP, MP, LT & CH Chairside Protection",
  description:
    "Compare the four AirGuard models: XP with HD camera and magnification, MP with integrated lighting, LT for existing suction and the mounted CH, and request a quote.",
};

// Structured data for search: the four models and the FAQ answers shown on the page.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AirGuard chairside protection models",
    itemListElement: airguardModels.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: m.name,
        description: m.value,
        image: m.image.src,
        brand: { "@type": "Brand", name: "AirGuard" },
        category: "Dental equipment",
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* 1. Brand pills + the runway ring of AirGuard models */}
      <ProductRunway />
      {/* 2. Climb the range, CH → XP (pinned on desktop) */}
      <ModelLadder />
      {/* 3. The flagship in 3D: hidden for now; every model opens in 3D in the hero instead */}
      {/* <XpExplorer /> */}
      {/* 4. Side-by-side comparison */}
      <CompareModels />
      {/* 5. Claims-safe proof, FAQs, next step */}
      {/* Claims section: hidden for now */}
      {/* <ProofSection /> */}
      <FaqSection />
      <ProductsCta />
    </>
  );
}
