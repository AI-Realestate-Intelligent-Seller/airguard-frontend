import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { airguardModels, evidence } from "@/data/airguard-models";
import { EvidenceCard } from "@/components/products/evidence-card";
import { type } from "@/components/products/type";

export const metadata: Metadata = {
  title: "Research & Sources | AirGuard Health",
  description: "The sources behind AirGuard product information: what each one supports, and what it does not prove.",
};

/*
 * Research & sources: the AirGuard entries of the Phase 1 Evidence Register, one card each,
 * anchored (#e-001…) so product features can link straight to their source.
 */
export default function Page() {
  return (
    <section className="bg-background pb-24 pt-[140px] md:pt-[180px]">
      <Container className="max-w-[1100px]">
        <p className={type.eyebrow}>AirGuard</p>
        <h1 className={`mt-3 ${type.h1}`}>Research</h1>

        <ol className="mt-12 flex flex-col gap-4">
          {evidence.map((e) => (
            <li key={e.id}>
              <EvidenceCard e={e} uses={airguardModels.flatMap((m) => m.features.filter((x) => x.source === e.id).map((x) => `${m.code}: ${x.label}`))} />
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
