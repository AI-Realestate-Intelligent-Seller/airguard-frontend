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
import { RelayBridge } from "@/components/motion/relay-bridge";

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
            <Aurora3D />
            {/* King Hydrogen → Arcane Herb: streams of light run left to right through both */}
            <RelayBridge />
            <Handoff
              eyebrow="Orrington Publishing"
              from="Wellness"
              to="Knowledge"
              accent="#e6c68e"
              line="The ideas behind our products, in books by Dr. James Orrington II."
              next={<BookStore />}
            >
              <ArcaneHerbs />
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
