import { PageInteractions } from "@/components/motion/page-interactions";
import { Hero } from "@/components/sections/hero";
import { FamilyStory } from "@/components/sections/family-story";
import { OurWorldStage } from "@/components/sections/our-world-stage";
import { AirGuard3D } from "@/components/sections/airguard-3d";
import { Aurora3D } from "@/components/sections/aurora-3d";
import { BookStore } from "@/components/sections/book-store";
import { ArcaneHerbs } from "@/components/sections/arcane-herbs";
import { GetInTouch } from "@/components/sections/get-in-touch";
import { Handoff } from "@/components/motion/handoff";
import { GenesisStory, InfusionStory } from "@/components/motion/stories";
import { DropReveal, WaveReveal } from "@/components/motion/liquid-reveal";

export default function Home() {
  return (
    <>
      <PageInteractions />
      <Hero />
      {/* The Journey opens through the hero's wheel, then the four brands (Our World) open over it */}
      <FamilyStory />
      <OurWorldStage />
      {/* Health, then wellness: each section holds while the next rises over it (Handoff) */}
      <Handoff
        eyebrow="AirGuard Health"
        from="Health"
        to="Wellness"
        accent="#8cc8f0"
        line="From protection at the dental chair to wellness at home, beginning with the water you drink."
        light
        next={
          <>
            {/* Before King Hydrogen (plays by itself): atoms → water molecules → DNA → a drop that falls into King Hydrogen */}
            <GenesisStory />
            {/* King Hydrogen emerges from where the drop struck the water */}
            <DropReveal base={{ light: "radial-gradient(90% 70% at 70% 45%,#ffffff 0%,#eef2f9 55%,#e2e9f5 100%)", dark: "radial-gradient(70% 60% at 68% 48%,#1b2333 0%,#0d1119 55%,#06080c 100%)" }}>
              <Aurora3D />
            </DropReveal>
            {/* King Hydrogen → Arcane Herb (plays by itself): water and leaves swirl, steep, bloom and rise */}
            <InfusionStory />
            <Handoff
              eyebrow="Orrington Publishing"
              from="Wellness"
              to="Knowledge"
              accent="#e6c68e"
              line="The ideas behind our products, in books by Dr. James Orrington II."
              next={<BookStore />}
            >
              {/* Arcane Herb emerges from where the drop struck the tea */}
              <WaveReveal tint="#b8813f">
                <ArcaneHerbs />
              </WaveReveal>
            </Handoff>
          </>
        }
      >
        <AirGuard3D />
      </Handoff>
      {/* Get in touch, over the team photo */}
      <GetInTouch />
    </>
  );
}
