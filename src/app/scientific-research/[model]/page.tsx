import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DetailHero } from "@/components/product-detail/detail-hero";
import { DetailCfd } from "@/components/product-detail/detail-cfd";
import { DetailTechnology } from "@/components/product-detail/detail-technology";
import { DetailResearch } from "@/components/product-detail/detail-sections";
import { ProductsCta } from "@/components/products/proof-faq-cta";
import { airguardModels, modelById, type ModelId } from "@/data/airguard-models";
import { cfdByModel, techTabs } from "@/data/airguard-technology";

/*
 * One model's science page: the product hero, then
 *   1. Technology (lighting, precision, interface, ergonomics; XP and MP)
 *   2. CFD analysis (the airflow simulations; not CH)
 *   3. Scientific research (its Evidence Register entries)
 *   4. "Ready to Purchase?" call to action, as on /products
 * Sections a model doesn't have are skipped, and the hero's scroll cue points at the first one.
 * Prerendered for xp, mp, lt and ch; any other slug is a 404.
 */
export function generateStaticParams() {
  return airguardModels.map((m) => ({ model: m.id }));
}

const find = (slug: string) => (slug in modelById ? modelById[slug as ModelId] : null);

export async function generateMetadata({ params }: PageProps<"/scientific-research/[model]">): Promise<Metadata> {
  const m = find((await params).model);
  if (!m) return {};
  return {
    title: `${m.name} Scientific Research & Technology | AirGuard Health`,
    description: `${m.name}: technology, CFD airflow analysis and the scientific research behind it.`,
  };
}

export default function Page({ params }: PageProps<"/scientific-research/[model]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-[100svh] bg-[#f3f6fb] dark:bg-[#0b1322]" />}>
      <ModelResearch params={params} />
    </Suspense>
  );
}

async function ModelResearch({ params }: { params: PageProps<"/scientific-research/[model]">["params"] }) {
  const m = find((await params).model);
  if (!m) notFound();
  const first = techTabs.some((t) => t.models.includes(m.id)) ? "#technology" : cfdByModel[m.id] ? "#cfd" : "#research";
  return (
    <>
      <DetailHero id={m.id} crumb="Scientific research" next={first} />
      <DetailTechnology id={m.id} />
      <DetailCfd id={m.id} />
      <DetailResearch id={m.id} />
      <ProductsCta />
    </>
  );
}
