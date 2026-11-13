import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DetailHero } from "@/components/product-detail/detail-hero";
import { DetailAnatomy } from "@/components/product-detail/detail-anatomy";
import { DetailSpecs } from "@/components/product-detail/detail-specs";
import { DetailClosing, DetailFeatures, DetailRange, DetailResearchLink } from "@/components/product-detail/detail-sections";
import { airguardModels, modelById, type ModelId } from "@/data/airguard-models";

/*
 * One AirGuard model, in the studio style of the MotionSites "Quantum Human" layout (light, dark
 * navy in dark mode):
 *   1. Hero: the model in 3D, large headline, price and Shop now
 *   2. Anatomy: pinned scroll that pulls the model apart, one documented part at a time
 *   3. Specifications as a technical drawing · 4. Features
 *   5. Link to /scientific-research/[model] (technology, CFD analysis and the research live there)
 *   6. The range · 7. Ready to purchase (navy band)
 * All copy comes from the Phase 1 documents. Prerendered for xp, mp, lt and ch; any other slug
 * is a 404. The params read sits under <Suspense> so client navigations into the page stay instant.
 */
export function generateStaticParams() {
  return airguardModels.map((m) => ({ model: m.id }));
}

const find = (slug: string) => (slug in modelById ? modelById[slug as ModelId] : null);

export async function generateMetadata({ params }: PageProps<"/products/[model]">): Promise<Metadata> {
  const m = find((await params).model);
  if (!m) return {};
  return { title: `${m.name} | AirGuard Health`, description: `${m.value} Components and specifications.` };
}

export default function Page({ params }: PageProps<"/products/[model]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-[100svh] bg-[#f3f6fb] dark:bg-[#0b1322]" />}>
      <ModelDetail params={params} />
    </Suspense>
  );
}

async function ModelDetail({ params }: { params: PageProps<"/products/[model]">["params"] }) {
  const m = find((await params).model);
  if (!m) notFound();
  return (
    <>
      <DetailHero id={m.id} />
      <DetailAnatomy id={m.id} />
      <DetailSpecs id={m.id} />
      <DetailFeatures id={m.id} />
      <DetailResearchLink id={m.id} />
      <DetailRange id={m.id} />
      <DetailClosing id={m.id} />
    </>
  );
}
