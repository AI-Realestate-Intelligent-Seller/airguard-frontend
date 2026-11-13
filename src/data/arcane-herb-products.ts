import type { StaticImageData } from "next/image";
import imgT01KidneyCleanse from "../../public/images/site/arcane-herb/t01-kidney-cleanse.webp";
import imgT02LungDetox from "../../public/images/site/arcane-herb/t02-lung-detox.webp";
import imgT03JujubeSleepPeace from "../../public/images/site/arcane-herb/t03-jujube-sleep-peace.webp";
import imgT05LiverDetox from "../../public/images/site/arcane-herb/t05-liver-detox.webp";
import imgT06BloodPressureBalance from "../../public/images/site/arcane-herb/t06-blood-pressure-balance.webp";
import imgT07NasalEase from "../../public/images/site/arcane-herb/t07-nasal-ease.webp";
import imgT08EyeClear from "../../public/images/site/arcane-herb/t08-eye-clear.webp";
import imgT09SugarBalance from "../../public/images/site/arcane-herb/t09-sugar-balance.webp";
import imgT10VocalClear from "../../public/images/site/arcane-herb/t10-vocal-clear.webp";
import imgT11HoneysuckleForsythiaCold from "../../public/images/site/arcane-herb/t11-honeysuckle-forsythia-cold.webp";
import imgT12SlimEase from "../../public/images/site/arcane-herb/t12-slim-ease.webp";
import imgT13BloodQiTonic from "../../public/images/site/arcane-herb/t13-blood-qi-tonic.webp";
import imgT15UricBalance from "../../public/images/site/arcane-herb/t15-uric-balance.webp";
import imgT16JointEase from "../../public/images/site/arcane-herb/t16-joint-ease.webp";
import imgT17LiverKidneyTonic from "../../public/images/site/arcane-herb/t17-liver-kidney-tonic.webp";
import imgT18MensTonic from "../../public/images/site/arcane-herb/t18-mens-tonic.webp";
import imgT19ImmuneDefense from "../../public/images/site/arcane-herb/t19-immune-defense.webp";
import imgT20AdaptogenTonic from "../../public/images/site/arcane-herb/t20-adaptogen-tonic.webp";
import imgT21ArteryFlow from "../../public/images/site/arcane-herb/t21-artery-flow.webp";
import imgT22Relaxing from "../../public/images/site/arcane-herb/t22-relaxing.webp";
import imgT23PancreasEase from "../../public/images/site/arcane-herb/t23-pancreas-ease.webp";
import imgT25ReishiTonic from "../../public/images/site/arcane-herb/t25-reishi-tonic.webp";
import imgT26Detox from "../../public/images/site/arcane-herb/t26-detox.webp";
import imgT27BrainTonic from "../../public/images/site/arcane-herb/t27-brain-tonic.webp";
import imgT28VitalityTonic from "../../public/images/site/arcane-herb/t28-vitality-tonic.webp";
import imgT29GinsengAstragalusTonic from "../../public/images/site/arcane-herb/t29-ginseng-astragalus-tonic.webp";
import imgT30ProstateEase from "../../public/images/site/arcane-herb/t30-prostate-ease.webp";
import imgT31MenopauseEase from "../../public/images/site/arcane-herb/t31-menopause-ease.webp";
import imgT32LipidBalance from "../../public/images/site/arcane-herb/t32-lipid-balance.webp";
import imgT33GutBalance from "../../public/images/site/arcane-herb/t33-gut-balance.webp";
import imgT35StomachTonic from "../../public/images/site/arcane-herb/t35-stomach-tonic.webp";
import imgT36BrainClear from "../../public/images/site/arcane-herb/t36-brain-clear.webp";
import imgT37WomensTonic from "../../public/images/site/arcane-herb/t37-womens-tonic.webp";
import imgT38HemorEase from "../../public/images/site/arcane-herb/t38-hemor-ease.webp";
import imgT39QiTonic from "../../public/images/site/arcane-herb/t39-qi-tonic.webp";
import imgT50Bupleurum from "../../public/images/site/arcane-herb/t50-bupleurum.webp";
import imgT51MoveEase from "../../public/images/site/arcane-herb/t51-move-ease.webp";
import imgT52JingTonic from "../../public/images/site/arcane-herb/t52-jing-tonic.webp";
import imgInsulatedCeramicTumblerForHerbalTea from "../../public/images/site/arcane-herb/insulated-ceramic-tumbler-for-herbal-tea.webp";

/** One of the numbered single-herb blends, e.g. T19 Immune Defense. */
export type ArcaneHerbTea = {
  /** Catalogue code printed on the pack. */
  code: string;
  name: string;
  slug: string;
  image: StaticImageData;
};

export type ArcaneHerbAccessory = {
  name: string;
  slug: string;
  image: StaticImageData;
};

/** Every tea in the line, ordered by pack code. */
export const arcaneHerbTeas: ArcaneHerbTea[] = [
  { code: "T01", name: "Kidney Cleanse", slug: "t01-kidney-cleanse", image: imgT01KidneyCleanse },
  { code: "T02", name: "Lung Detox", slug: "t02-lung-detox", image: imgT02LungDetox },
  { code: "T03", name: "Jujube Sleep Peace", slug: "t03-jujube-sleep-peace", image: imgT03JujubeSleepPeace },
  { code: "T05", name: "Liver Detox", slug: "t05-liver-detox", image: imgT05LiverDetox },
  { code: "T06", name: "Blood Pressure Balance", slug: "t06-blood-pressure-balance", image: imgT06BloodPressureBalance },
  { code: "T07", name: "Nasal Ease", slug: "t07-nasal-ease", image: imgT07NasalEase },
  { code: "T08", name: "Eye Clear", slug: "t08-eye-clear", image: imgT08EyeClear },
  { code: "T09", name: "Sugar Balance", slug: "t09-sugar-balance", image: imgT09SugarBalance },
  { code: "T10", name: "Vocal Clear", slug: "t10-vocal-clear", image: imgT10VocalClear },
  { code: "T11", name: "Honeysuckle & Forsythia Cold", slug: "t11-honeysuckle-forsythia-cold", image: imgT11HoneysuckleForsythiaCold },
  { code: "T12", name: "Slim Ease", slug: "t12-slim-ease", image: imgT12SlimEase },
  { code: "T13", name: "Blood & Qi Tonic", slug: "t13-blood-qi-tonic", image: imgT13BloodQiTonic },
  { code: "T15", name: "Uric Balance", slug: "t15-uric-balance", image: imgT15UricBalance },
  { code: "T16", name: "Joint Ease", slug: "t16-joint-ease", image: imgT16JointEase },
  { code: "T17", name: "Liver & Kidney Tonic", slug: "t17-liver-kidney-tonic", image: imgT17LiverKidneyTonic },
  { code: "T18", name: "Men's Tonic", slug: "t18-mens-tonic", image: imgT18MensTonic },
  { code: "T19", name: "Immune Defense", slug: "t19-immune-defense", image: imgT19ImmuneDefense },
  { code: "T20", name: "Adaptogen Tonic", slug: "t20-adaptogen-tonic", image: imgT20AdaptogenTonic },
  { code: "T21", name: "Artery Flow", slug: "t21-artery-flow", image: imgT21ArteryFlow },
  { code: "T22", name: "Relaxing", slug: "t22-relaxing", image: imgT22Relaxing },
  { code: "T23", name: "Pancreas Ease", slug: "t23-pancreas-ease", image: imgT23PancreasEase },
  { code: "T25", name: "Reishi Tonic", slug: "t25-reishi-tonic", image: imgT25ReishiTonic },
  { code: "T26", name: "Detox", slug: "t26-detox", image: imgT26Detox },
  { code: "T27", name: "Brain Tonic", slug: "t27-brain-tonic", image: imgT27BrainTonic },
  { code: "T28", name: "Vitality Tonic", slug: "t28-vitality-tonic", image: imgT28VitalityTonic },
  { code: "T29", name: "Ginseng & Astragalus Tonic", slug: "t29-ginseng-astragulus-tonic", image: imgT29GinsengAstragalusTonic },
  { code: "T30", name: "Prostate Ease", slug: "t30-prostate-ease", image: imgT30ProstateEase },
  { code: "T31", name: "Menopause Ease", slug: "t31-menopause-ease", image: imgT31MenopauseEase },
  { code: "T32", name: "Lipid Balance", slug: "t32-lipid-balance", image: imgT32LipidBalance },
  { code: "T33", name: "Gut Balance", slug: "t33-gut-balance", image: imgT33GutBalance },
  { code: "T35", name: "Stomach Tonic", slug: "t35-stomach-tonic", image: imgT35StomachTonic },
  { code: "T36", name: "Brain Clear", slug: "t36-brain-clear", image: imgT36BrainClear },
  { code: "T37", name: "Women's Tonic", slug: "t37-womens-tonic", image: imgT37WomensTonic },
  { code: "T38", name: "Hemor Ease", slug: "t38-hemor-ease", image: imgT38HemorEase },
  { code: "T39", name: "Qi Tonic", slug: "t39-qi-tonic", image: imgT39QiTonic },
  { code: "T50", name: "Bupleurum", slug: "t50-bupleurum", image: imgT50Bupleurum },
  { code: "T51", name: "Move Ease", slug: "t51-move-ease", image: imgT51MoveEase },
  { code: "T52", name: "Jing Tonic", slug: "t52-jing-tonic", image: imgT52JingTonic },
];

export const arcaneHerbAccessories: ArcaneHerbAccessory[] = [
  { name: "Insulated Ceramic Tumbler, 16 oz", slug: "insulated-ceramic-tumbler-for-herbal-tea", image: imgInsulatedCeramicTumblerForHerbalTea },
];

/** Codes shown in the lineup grid on the AirGuard home page. */
const FEATURED = ["T03", "T05", "T19", "T20", "T22", "T26", "T27", "T33"];

export const featuredArcaneHerbTeas: ArcaneHerbTea[] = FEATURED.map((code) => {
  const tea = arcaneHerbTeas.find((t) => t.code === code);
  if (!tea) throw new Error(`Unknown Arcane Herb tea code: ${code}`);
  return tea;
});

/** Where Arcane Herb links go: the home page section (there are no blend pages yet). */
export const arcaneHerbsHref = "/#arcane-herbs";
