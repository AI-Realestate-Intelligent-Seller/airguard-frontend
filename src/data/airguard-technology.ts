import type { StaticImageData } from "next/image";
import type { ModelId } from "@/data/airguard-models";
import cfdAirflowPoster from "../../public/images/site/technology/cfd-airflow-poster.webp";
import cfdHoseOnly from "../../public/images/site/technology/cfd-hose-only.webp";
import cfdAirGuard from "../../public/images/site/technology/cfd-airguard.webp";
import cfdLt from "../../public/images/site/technology/cfd-lt.webp";
import cfdMp from "../../public/images/site/technology/cfd-mp.webp";
import ledsCycle from "../../public/images/site/technology/leds-colors-cycle.webp";
import ledsChart from "../../public/images/site/technology/leds-colors.webp";
import beamDistances from "../../public/images/site/technology/xp-beam-distances.webp";
import xpInterface from "../../public/images/site/technology/xp-interface.webp";
import mpHandle from "../../public/images/site/technology/mp-handle.webp";
import xpButtons from "../../public/images/site/technology/xp-buttons.webp";

/*
 * Images and wording from airguardhealth.com/technology [T], with the Phase 1 claims workbook [D]
 * taking precedence: the site's stronger lines ("forces aerosols to immediately evacuate",
 * "replace your dental light", "do away with loupes") are not used; the barrier mechanism uses the
 * A-008 QUALIFY wording. Image labels are the site's own alt text / file names.
 */

const A008 = "Designed to act as a physical barrier and help direct aerosol/splatter toward suction."; // [D] A-008

export type CfdView = {
  id: string;
  /** [T] the image's alt text on the site. */
  label: string;
  caption: string;
  image: StaticImageData;
  /** Animated CFD (webm), with `image` as its poster. */
  video?: string;
};

const views: Record<string, CfdView> = {
  animation: { id: "animation", label: "CFD animation", caption: A008, image: cfdAirflowPoster, video: "/images/site/technology/cfd-airflow.webm" },
  hoseOnly: {
    id: "hose-only",
    label: "Hose only CFD",
    // [T]
    caption: "Computational Fluid Dynamics studies show that vacuuming from the side of the patient causes the aerosols to flow over the face.",
    image: cfdHoseOnly,
  },
  airguard: { id: "airguard", label: "AirGuard CFD analysis", caption: A008, image: cfdAirGuard },
  lt: { id: "lt", label: "AirGuard LT CFD analysis", caption: A008, image: cfdLt },
  mp: { id: "mp", label: "AirGuard MP CFD analysis", caption: "The AirGuard™ acts as a barrier between the clinician and the patient.", image: cfdMp }, // [T]
};

/** CFD views per model. CH has none: it is a mounted barrier without suction integration [D]. */
export const cfdByModel: Partial<Record<ModelId, CfdView[]>> = {
  xp: [views.airguard, views.animation, views.hoseOnly],
  mp: [views.mp, views.airguard, views.hoseOnly],
  lt: [views.lt, views.animation, views.hoseOnly],
};

export const cfdCredit = "CFD Analysis by Sean Borchert Design"; // [T] (the site misspells "Analysis")

export type TechTab = {
  id: string;
  /** [T] the site's section heading. */
  section: string;
  /** [T] the site's sub-heading. */
  title: string;
  lines: string[];
  specs: string[];
  image: StaticImageData;
  /** A smaller second image shown over the main one. */
  inset?: { image: StaticImageData; alt: string };
  alt: string;
  /** Colour chips, for the lighting tab. */
  swatches?: { name: string; value: string; hex: string }[];
  models: ModelId[];
};

/** [T] airguardhealth.com/technology, verbatim. */
export const techTabs: TechTab[] = [
  {
    id: "lighting",
    section: "Integrated LED Lighting System",
    title: "Colors right where you need them.",
    lines: [
      "Change the lighting color to warm white, cool white, amber or blue to coincide with your procedure.",
      "AirGuard™ provides two shades of white to fit your needs.",
    ],
    specs: [],
    swatches: [
      { name: "Warm White LED", value: "2700K", hex: "#ffd9a3" },
      { name: "Cool White LED", value: "6500K", hex: "#eef4ff" },
      { name: "Amber LED", value: "2200K", hex: "#ffb347" },
      { name: "Blue LED", value: "470nm wavelength", hex: "#3d6dff" },
    ],
    image: ledsCycle,
    alt: "AirGuard integrated LED side strips cycling through their colors",
    inset: { image: ledsChart, alt: "Chromaticity chart marking Warm White 2700K, Cool White 6500K, Amber 2200K and Blue 470nm" },
    models: ["xp", "mp"],
  },
  {
    id: "precision",
    section: "Integrated LED Lighting System",
    title: "Direct the light exactly where you need it.",
    lines: ["Precision lighting allows the clinician to see hard-to-light areas such as maxillary posterior buccal surfaces."],
    specs: [
      "Warm and Cool White combination LED in one: 2700K ~ 6500K",
      "High lumen density for directional lighting",
      "Enables system beam angles from 10 to 40 degrees",
      "Consistent white light <3 SDCM",
      "Robust design with LM-80-tested MP-1616 series LEDs",
    ],
    image: beamDistances,
    alt: "AirGuard XP spotlight beams, shown at 10, 13 and 16 inches",
    models: ["xp", "mp"],
  },
  {
    id: "interface",
    section: "High-Definition Camera + Interface",
    title: "Touch, zoom and pan with one interface.",
    lines: [
      "Review previous photo captures on the screen and flip the interface up when not in use.",
      "With asepsis in mind, both sides of the interface are easy to disinfect.",
    ],
    specs: [
      "13.0 MP color camera with 4-lane MIPI CSI-2 interface",
      "Focus type: autofocus (VCM driven)",
      "Full HD (1080p) 60 fps",
      "Quad HD 2560 x 1600 IPS screen",
      "10.1” LED display with a wide viewing angle",
      "Capacitive USB touch screen",
    ],
    image: xpInterface,
    alt: "AirGuard XP interface showing an intra-oral image",
    models: ["xp"],
  },
  {
    id: "ergonomics",
    section: "Intuitive Ergonomics",
    title: "Ergonomic handle moves to where you work.",
    lines: [
      "The wide handle was strategically designed for ease of positioning by the dentist or support staff.",
      "All AirGuard™ operation buttons are within reaching distance.",
    ],
    specs: [
      "The smooth-surfaced buttons allow for the use of barrier tape and easy disinfecting.",
      "Simplified symbols are easy to read.",
    ],
    image: mpHandle,
    alt: "AirGuard MP ergonomic handle",
    inset: { image: xpButtons, alt: "AirGuard buttons: Color, Dimmer, Brighter, Power" },
    models: ["xp", "mp"],
  },
];
