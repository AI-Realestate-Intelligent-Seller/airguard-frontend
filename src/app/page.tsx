import { PageInteractions } from "@/components/motion/page-interactions";
import { Hero } from "@/components/sections/hero";
import { FamilyStory } from "@/components/sections/family-story";
import { OurWorldStage } from "@/components/sections/our-world-stage";
import { AirGuard3D } from "@/components/sections/airguard-3d";
import { Aurora3D } from "@/components/sections/aurora-3d";
import { BookStore } from "@/components/sections/book-store";
import { ArcaneHerbs } from "@/components/sections/arcane-herbs";
import { GetInTouch } from "@/components/sections/get-in-touch";

export default function Home() {
  return (
    <>
      <PageInteractions />
      <Hero />
      {/* The Journey opens through the hero's wheel, then the four brands (Our World) open over it */}
      <FamilyStory />
      <OurWorldStage />
      {/* AirGuard XP in 3D: opens over the four cards, drag to turn, hover a part */}
      <AirGuard3D />
      {/* King Hydrogen Aurora in 3D, right beside it: drag to turn, hover a part */}
      <Aurora3D />
      {/* Orrington Publishing: The Throne and Liberty film (scroll plays it), then the store shelf */}
      <BookStore />
      {/* Arcane Herbs: its film played by the scroll, then Get in touch */}
      <ArcaneHerbs />
      {/* Get in touch, over the team photo */}
      <GetInTouch />
    </>
  );
}
