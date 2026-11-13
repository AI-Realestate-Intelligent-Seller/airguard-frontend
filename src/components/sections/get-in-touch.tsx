"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCardHover, CARD_HOVER_CLASS } from "@/components/motion/use-card-hover";
import ada from "../../../public/images/site/logos/ada.webp";
import ieee from "../../../public/images/site/logos/ieee.webp";
import ces from "../../../public/images/site/logos/ces.webp";
import ads from "../../../public/images/site/logos/ads.webp";
import teamPhoto from "../../../public/images/site/contact/team-photo.webp";

const logos = [
  {
    src: ada,
    alt: "American Dental Association",
    name: "American Dental Association",
    height: 44,
    glow: "#2e9b4f",
  },
  {
    src: ieee,
    alt: "IEEE",
    name: "Institute of Electrical and Electronics Engineers",
    height: 56,
    glow: "#0071ba",
  },
  {
    src: ces,
    alt: "CES — Consumer Technology Association",
    name: "Consumer Technology Association",
    height: 36,
    glow: "#1b1f4b",
  },
  {
    src: ads,
    alt: "Association for Dental Safety",
    name: "Association for Dental Safety",
    height: 48,
    glow: "#5b3e96",
  },
];

function TrustCard({ logo }: { logo: (typeof logos)[number] }) {
  const { ref, onPointerMove } = useCardHover<HTMLDivElement>();

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn("group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm", CARD_HOVER_CLASS)}
      style={{ "--glow": logo.glow } as CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(180px circle at var(--x, 50%) var(--y, 50%), color-mix(in oklch, var(--glow) 18%, transparent), transparent 70%)",
        }}
      />
      {/* Fixed-height row so logos of different native proportions still sit on
          one shared baseline, instead of each card growing to its own content. */}
      <div className="relative flex h-16 w-full shrink-0 items-center justify-center">
        <Image src={logo.src} alt={logo.alt} style={{ height: logo.height, width: "auto" }} />
      </div>
      <p className="relative mt-3 flex min-h-[2.25rem] items-center text-xs text-muted-foreground">
        {logo.name}
      </p>
      {/* mt-auto pins this to the card's bottom edge regardless of whether the
          caption above wrapped to one line or two, so every card ends flush. */}
      <div className="relative mt-auto w-full pt-4">
        <div
          aria-hidden
          className="mx-auto h-[2px] w-8 rounded-full transition-all duration-300 group-hover:w-14"
          style={{ backgroundColor: "var(--glow)" }}
        />
      </div>
    </div>
  );
}

export function GetInTouch() {
  const paused = false;
  return (
    // Set over the team photo (formerly the "Designed to Protect You" band), under a light navy tint.
    <Section id="contact" theme="dark" className="relative isolate overflow-hidden py-20 md:py-28">
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <Image src={teamPhoto} alt="" fill sizes="100vw" className="animate-slow-zoom object-cover object-top" />
        <div className="absolute inset-0 bg-navy/25" />
      </div>
      <Container>
        <Reveal blur>
          <div className="mx-auto max-w-xl text-center [text-shadow:0_2px_18px_rgba(10,16,30,0.6)]">
            <h2 className="text-3xl md:text-5xl font-medium leading-tight text-white">
              Get in touch
            </h2>
            <p className="mt-4 text-base font-light leading-[1.8] text-white/90">
              Our team is excited to help you select the right AirGuard
              product for your office. Reach out with any questions and
              we&apos;ll get back to you as soon as possible.
            </p>
            <Link
              href="/contact"
              className={cn(buttonVariants({ size: "lg" }), "mt-6 px-6 text-base")}
            >
              Contact Us
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-20 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/85 [text-shadow:0_1px_10px_rgba(10,16,30,0.6)]">
            Proud Associates With
          </p>
        </Reveal>

        <div className="marquee-window mt-10" data-paused={paused}>
          <div className="marquee-track">
            {[0, 1].map(copy => <div key={copy} className="marquee-group" aria-hidden={copy === 1 ? true : undefined}>
              {logos.map(logo => <div key={logo.alt} className="w-[240px] shrink-0"><TrustCard logo={logo} /></div>)}
            </div>)}
          </div>
        </div>
        {/* <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} className="mx-auto mt-5 block rounded-full border px-4 py-2 text-xs text-muted-foreground">{paused ? "Play logo motion" : "Pause logo motion"}</button> */}
      </Container>
    </Section>
  );
}
