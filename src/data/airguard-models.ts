import type { StaticImageData } from "next/image";
import productXp from "../../public/images/site/airguard/product-xp.webp";
import productMp from "../../public/images/site/airguard/product-mp.webp";
import productLt from "../../public/images/site/airguard/product-lt-hero.webp";
import productCh from "../../public/images/site/airguard/product-ch.webp";

/*
 * AirGuard product content. Every visible line comes from one of two sources, and nothing else:
 *   [D] Phase 1 Evidence & Claims Control System (Drive): SKU Map, Claims Register (A-0xx),
 *       Evidence Register (E-0xx), AirGuard Product Comparison (incl. 2021 spec-sheet sizes)
 *   [W] airguardhealth.com: model pages (/airguard-xp, -mp, -lt, -ch-1), [T] /technology, [F] /faqs
 * Where the website and the documents disagree, the documents win (they are the claims control):
 *   - not used: "eliminates loupes" (A-009 TEST REQUIRED, A-009 wording used instead),
 *     "superior protection" / "decreasing overspray" (Comparison: avoid untested efficacy wording)
 *   - not used until confirmed (Phase 1 open questions): hose/cuff 3–6″ (conflicts with the 2021
 *     sheets), 90-day warranty, LT "disposable after 6 months", CH "What's included" on the
 *     website (an XP copy error; the spec sheet's list is used)
 * The LT shot is "LT HERO 3" from airguardhealth.com/products, cut out of its background.
 */

export type ModelId = "xp" | "mp" | "lt" | "ch";

/** [D] Evidence Register, AirGuard entries, verbatim. */
export type EvidenceId = "e-001" | "e-002" | "e-003";
export const evidence: { id: EvidenceId; source: string; type: string; finding: string; supports: string; notProven: string; url: string }[] = [
  {
    id: "e-001",
    source: "AirGuard Products / Technology pages",
    type: "Company product source",
    finding: "Confirms four AirGuard SKUs and detailed XP/MP/LT/CH features",
    supports: "Portfolio architecture and observable/configuration features",
    notProven: "Independent clinical efficacy or quantified aerosol reduction",
    url: "https://www.airguardhealth.com/technology",
  },
  {
    id: "e-002",
    source: "AirGuard FAQ",
    type: "Company support source",
    finding: "Clarifies current vs future connectivity and image-transfer capabilities",
    supports: "USB transfer current; Bluetooth/Wi-Fi future/considered",
    notProven: "Current Bluetooth/Wi-Fi integration",
    url: "https://www.airguardhealth.com/faqs",
  },
  {
    id: "e-003",
    source: "Harrel & Molinari, Aerosols and splatter in dentistry",
    type: "Peer-reviewed review",
    finding: "Dental procedures generate aerosol/splatter; layered controls including HVE discussed",
    supports: "Problem evidence and category rationale",
    notProven: "AirGuard-specific efficacy",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7093851/",
  },
];

export type Feature = { label: string; source: EvidenceId };
const f = (label: string, source: EvidenceId = "e-001"): Feature => ({ label, source });

export type AirGuardModel = {
  id: ModelId;
  code: string;
  name: string;
  /** [D] SKU Map "Current Role". */
  role: string;
  /** [W] the model page's opening sentence. */
  value: string;
  /** Each links to its evidence. */
  features: Feature[];
  /** USD. null until a price is supplied: shown as "Price on request". */
  price: number | null;
  specs: { label: string; value: string }[];
  /** Evidence Register entries shown under "Scientific research" on the detail page. */
  research: EvidenceId[];
  /** Detail-page anatomy: one step per 3D part (ids match the scene). */
  anatomy: { part: string; name: string; line: string }[];
  /** [D] Overall size for the technical drawing (2021 spec sheets). */
  drawing: { label: string; value: string }[];
  /** [D] Product Comparison "Best-fit routing". */
  bestFor: string;
  image: StaticImageData;
};

/** Until an online store exists, "Shop now" leads to the purchase enquiry. One place to change it. */
export const shopHref = "/contact";

const cleaning = "All AirGuard™ units can be cleaned with a disinfectant such as Cavi-Wipes. Soft lint-free cotton or microfiber cloth recommended."; // [F]
const colours = "Warm White (2700K), Cool White (6500K), Amber (2200K), Blue (470nm)"; // [W]

/** Runway order: flagship first. */
export const airguardModels: AirGuardModel[] = [
  {
    id: "xp",
    code: "XP",
    name: "AirGuard XP",
    role: "Flagship model", // [D]
    value: "AirGuard™ XP is the most technologically advanced aerosol guard.", // [W]
    features: [
      f("Integrated HD camera"), // [D] A-002
      f("Integrated magnification for enhanced visualization"), // [D] A-003
      f("Integrated adjustable procedure lighting"), // [D] A-004
      f("Integrated high-definition screen"), // [D] Comparison
      f("Extra-oral suction"), // [W]
      f("Files can be downloaded to a USB thumb drive", "e-002"), // [F]
    ],
    price: null,
    specs: [
      { label: "Dimensions", value: "26.66 × 15.87 × 7 in" }, // [D] 2021 spec sheet
      { label: "Positioning", value: "Designed to sit 12” above the patient" }, // [W]
      { label: "Lighting", value: `LED side strips + four corner spotlights. ${colours}. Dimmable.` }, // [W] [F]
      { label: "Camera", value: "13.0 MP color camera · autofocus (VCM driven) · Full HD (1080p) 60 fps" }, // [T]
      { label: "Interface", value: "10.1” LED display · Quad HD 2560 x 1600 IPS · capacitive USB touch screen" }, // [T]
      { label: "Image transfer", value: "USB thumb drive" }, // [F]
      { label: "Adjustable", value: "Stay in a neutral working position" }, // [W]
      { label: "Cleaning", value: cleaning },
      { label: "What's included", value: "One AirGuard™ XP unit with integrated camera, lighting, and attachment cuff" }, // [W]
    ],
    research: ["e-001", "e-002", "e-003"],
    anatomy: [
      { part: "shield", name: "Barrier", line: "Designed to act as a physical barrier and help direct aerosol/splatter toward suction." }, // [D] A-008
      { part: "suction", name: "Extra-oral suction", line: "Move contaminated air away from you and the patient." }, // [W]
      { part: "lighting", name: "LED side strips", line: "Multi-colored integrated lighting illuminates the entire mouth." }, // [W]
      { part: "precision", name: "Four corner spotlights", line: "Four corner spotlights deliver precision lighting." }, // [W]
      { part: "magnification", name: "Magnification", line: "The high-resolution interface allows for intra-oral and extra-oral magnification." }, // [W]
      { part: "camera", name: "High-definition camera", line: "Take intra-oral and extra-oral photos in one simple step." }, // [W]
      { part: "handle", name: "Ergonomic handle", line: "The wide handle was strategically designed for ease of positioning by the dentist or support staff." }, // [T]
    ],
    drawing: [
      { label: "Width", value: "26.66 in" },
      { label: "Depth", value: "15.87 in" },
      { label: "Height", value: "7 in" },
    ],
    bestFor: "Tech-forward practices, DSOs, dental schools, visualization/documentation workflows", // [D]
    image: productXp,
  },
  {
    id: "mp",
    code: "MP",
    name: "AirGuard MP",
    role: "Integrated model", // [D]
    value: "The portable AirGuard™ MP is equipped with an adjustable guard, extra-oral suction and integrated lighting.", // [W]
    features: [
      f("LED side strips + four corner spotlights"), // [D] Comparison
      f("Warm white, cool white, amber and blue"), // [W]
      f("All the LED lights are dimmable", "e-002"), // [F]
      f("Easy-to-clean polycarbonate guard"), // [W]
      f("Extra-oral suction"), // [W]
    ],
    price: null,
    specs: [
      { label: "Dimensions", value: "26.66 × 15.87 × 7 in" }, // [D]
      { label: "Positioning", value: "Sits approximately 12” above the patient" }, // [W]
      { label: "Lighting", value: `LED side strips + four corner spotlights. ${colours}. Dimmable.` }, // [W] [F]
      { label: "Guard", value: "Easy-to-clean polycarbonate guard" }, // [W]
      { label: "Ergonomic", value: "Height adjusts and easily rotates when attached to a suction unit" }, // [W]
      { label: "Cleaning", value: cleaning },
      { label: "What's included", value: "One AirGuard™ MP guard with integrated lighting and attachment cuff" }, // [W]
    ],
    research: ["e-001", "e-002", "e-003"],
    anatomy: [
      { part: "shield", name: "Barrier", line: "Designed to act as a physical barrier and help direct aerosol/splatter toward suction." }, // [D] A-008
      { part: "suction", name: "Extra-oral suction", line: "Extra-oral suction pulls contaminated air away from you and the patient." }, // [W]
      { part: "lighting", name: "LED side strips", line: "Integrated lighting offers multiple color options: warm white, cool white, amber and blue." }, // [W]
      { part: "precision", name: "Four corner spotlights", line: "Four corner spotlights provide precision lighting." }, // [W]
      { part: "handle", name: "Ergonomic handle", line: "Raise, lower or angle the guard for personal preference to keep your posture in a neutral position." }, // [T]
    ],
    drawing: [
      { label: "Width", value: "26.66 in" },
      { label: "Depth", value: "15.87 in" },
      { label: "Height", value: "7 in" },
    ],
    bestFor: "Practice wanting integrated suction + lighting without camera/magnification", // [D]
    image: productMp,
  },
  {
    id: "lt",
    code: "LT",
    name: "AirGuard LT",
    role: "Shield / existing-suction model", // [D]
    value: "AirGuard™ LT is our reusable, recyclable shield for those who already use an extra-oral suction unit.", // [W]
    features: [
      f("Easily slides onto most oral suction support systems"), // [W]
      f("Made from recyclable PETG plastic"), // [W]
      f("Reusable"), // [W]
      f("Up to 12” of space between the patient and provider"), // [W]
    ],
    price: null,
    specs: [
      { label: "Dimensions", value: "24.4 × 13.5 × 7.25 in" }, // [D]
      { label: "Mounting", value: "Easily slides onto most oral suction support systems. A zip tie connects around the vacuum for added support and stability." }, // [W]
      { label: "Positioning", value: "Up to 12” of space between the patient and provider" }, // [W]
      { label: "Material", value: "Made from recyclable PETG plastic · reusable" }, // [W]
      { label: "Ergonomic", value: "Height and rotation are adjustable when attached to suction unit" }, // [W]
      { label: "Cleaning", value: cleaning },
      { label: "What's included", value: "One AirGuard™ LT Shield · One White Zip Tie" }, // [W]
    ],
    research: ["e-001", "e-003"],
    anatomy: [
      { part: "shield", name: "Curved barrier", line: "Up to 12” of space between the patient and provider." }, // [W]
      { part: "band", name: "Shield", line: "Made from recyclable PETG plastic. Reusable." }, // [W]
      { part: "suction", name: "Suction attachment", line: "Easily slides onto most oral suction support systems." }, // [W]
    ],
    drawing: [
      { label: "Width", value: "24.4 in" },
      { label: "Depth", value: "13.5 in" },
      { label: "Height", value: "7.25 in" },
    ],
    bestFor: "Practice already owning extra-oral suction and needing a broad guard", // [D]
    image: productLt,
  },
  {
    id: "ch",
    code: "CH",
    name: "AirGuard CH",
    role: "Chair/furniture-mount model", // [D]
    value: "The AirGuard™ CH is designed to be used in all kinds of clinical environments and spaces.", // [W]
    features: [
      f("Freedom of mounting to any furniture"), // [W]
      f("Flexible arm allows desired positioning"), // [D] Comparison
      f("Scratch-resistant high-impact plastic shield"), // [W]
      f("Reusable"), // [W]
    ],
    price: null,
    specs: [
      { label: "Arm", value: "36” flexible arm" }, // [D] 2021 spec sheet
      { label: "Clamp", value: "Attaches to a surface of thicknesses varying from 1/4 in to 1 1/4 in" }, // [W]
      { label: "Shield", value: "Scratch-resistant high-impact plastic" }, // [W]
      { label: "Care", value: "Low-maintenance and portable. Easy to install, clean, and reusable." }, // [W]
      { label: "Cleaning", value: cleaning },
      { label: "What's included", value: "CH shield, flexible arm/clamp, two fixtures (inner and outer)" }, // [D] spec sheet
    ],
    research: ["e-001", "e-003"],
    anatomy: [
      { part: "shield", name: "Shield", line: "Clinical aerosol shield with flexible mounting options." }, // [D] A-007
      { part: "arm", name: "Flexible arm", line: "The flexible arm allows you to place it in any desired position." }, // [W]
      { part: "clamp", name: "Clamp", line: "The clamp can adjust to various different objects with different thicknesses." }, // [W]
    ],
    drawing: [
      { label: "Arm", value: "36 in" },
      { label: "Clamp", value: "1/4–1 1/4 in" },
    ],
    bestFor: "Practice wanting a simple chair/furniture-mounted physical barrier", // [D]
    image: productCh,
  },
];

export const modelById = Object.fromEntries(airguardModels.map((m) => [m.id, m])) as Record<ModelId, AirGuardModel>;

/** The range from simplest to flagship, for the ladder. */
export const ladderOrder: ModelId[] = ["ch", "lt", "mp", "xp"];

/** [D] Product Comparison rows, as present / not present per model. */
export const capabilities: { label: string; models: ModelId[] }[] = [
  { label: "Aerosol barrier / containment", models: ["xp", "mp", "lt", "ch"] },
  { label: "Flexible arm + adjustable clamp", models: ["ch"] },
  { label: "Extra-oral suction", models: ["xp", "mp", "lt"] },
  { label: "Attachment cuff", models: ["xp", "mp"] },
  { label: "Integrated lighting", models: ["xp", "mp"] },
  { label: "Dimmable lighting", models: ["xp", "mp"] },
  { label: "Ergonomic handle", models: ["xp", "mp"] },
  { label: "Magnification", models: ["xp"] },
  { label: "High-definition camera", models: ["xp"] },
  { label: "Integrated LCD / high-def screen", models: ["xp"] },
];

type Cell = boolean | string;
/** [D] Product Comparison, in column order XP, MP, LT, CH. */
export const compareColumns: ModelId[] = ["xp", "mp", "lt", "ch"];
export const compareRows: { group: string; rows: { label: string; cells: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    group: "Protection",
    rows: [
      { label: "Aerosol barrier / containment", cells: [true, true, true, true] },
      { label: "Extra-oral suction", cells: ["Uses/attaches to suction system", "Uses/attaches to suction system", "Uses existing extra-oral suction unit", false] },
      { label: "Mounting / attachment", cells: ["Attachment cuff to suction unit", "Attachment cuff to suction unit", "Slides onto suction support system + white zip tie", "Flexible arm + adjustable clamp"] },
      { label: "Approx. working distance", cells: ["≈12″ above patient", "≈12″ above patient", "Up to 12″ between patient/provider", "User-positioned via flexible arm"] },
    ],
  },
  {
    group: "Light and vision",
    rows: [
      { label: "LED side strips + four corner spotlights", cells: [true, true, false, false] },
      { label: "Warm White · Cool White · Amber · Blue", cells: [true, true, false, false] },
      { label: "Dimmable lighting", cells: [true, true, false, false] },
      { label: "Magnification", cells: [true, false, false, false] },
      { label: "High-definition camera", cells: [true, false, false, false] },
      { label: "Image transfer", cells: ["USB thumb drive", false, false, false] },
    ],
  },
  {
    group: "Build",
    rows: [
      { label: "Ergonomic handle", cells: [true, true, false, false] },
      { label: "Guard material", cells: ["Not specifically identified", "Easy-to-clean polycarbonate", "Recyclable PETG plastic", "Scratch-resistant high-impact plastic"] },
      { label: "Reusable guard", cells: [true, true, true, true] },
      { label: "Portable / movable", cells: [true, true, true, true] },
      { label: "Dimensions*", cells: ["26.66″ × 15.87″ × 7″", "26.66″ × 15.87″ × 7″", "24.4″ × 13.5″ × 7.25″", "36″ arm; clamp 1/4″–1 1/4″"] },
    ],
  },
];

/** Fit finder: a short decision path to one model ([D] best-fit routing). */
export const fitQuestions = {
  suction: "Do you already own an extra-oral suction unit?",
  imaging: "Do you need a camera and magnification?",
  lighting: "Do you need integrated lighting?",
} as const;

/** [F] airguardhealth.com/faqs, verbatim (warranty left out until confirmed); loupes answer is [D] A-009. */
export const faqs: { q: string; a: string }[] = [
  { q: "What should I clean the guards with?", a: "All AirGuard™ units can be cleaned with a disinfectant such as Cavi-Wipes. We recommend using a soft cloth such as lint-free cotton or microfiber to reduce haze." },
  { q: "Can I move the units from one operatory to another?", a: "All AirGuard™ units can be moved; however, we recommend you purchase an AirGuard™ LT for each suction unit." },
  { q: "Is the integrated lighting movable or dimmable?", a: "All the LED lights are dimmable and the guard can be adjusted to direct the lighting to the proper position." },
  { q: "Do I have to download images to my network or are they automatically linked to the patient file?", a: "Files can be downloaded to a USB thumb drive to be transferred from the unit. Wi-Fi and Bluetooth integrations for easy transfer of files are being considered for future designs." },
  { q: "Is the high-def camera and magnification Bluetooth capable?", a: "AirGuard™ models are not Bluetooth compatible. This capability is being considered for future designs." },
  { q: "Is AirGuard™ LT shipped assembled?", a: "The AirGuard™ LT is shipped unassembled. It takes only minutes to easily fold perforated edges together." },
  { q: "Does the XP replace loupes?", a: "Alternative visualization option to complement or reduce reliance on traditional loupes." },
  { q: "How do I order?", a: "To place an order, please call 877-412-3405." },
];

export const salesPhone = { label: "(877) 412-3405", href: "tel:+18774123405" };
