import { airguardModels } from "./airguard-models";
import { arcaneHerbAccessories, arcaneHerbTeas } from "./arcane-herb-products";
import { storeBooks } from "./book-store";
import { productsMenu } from "./products-menu";

/*
 * Product and type choices for the contact form, built from the existing catalogues so the form
 * can't drift from what the site shows: the four AirGuard models, the King Hydrogen range from the
 * products menu, every Arcane Herb blend (plus accessories) and every book in the store.
 */
export type ContactProduct = {
  id: string;
  label: string;
  /** Choices for the "Type" dropdown; empty when there's nothing to narrow down. */
  types: string[];
};

const kingHydrogen = productsMenu.find((c) => c.id === "king-hydrogen")?.items.map((i) => i.name) ?? [];

export const contactProducts: ContactProduct[] = [
  { id: "airguard", label: "AirGuard™", types: airguardModels.map((m) => m.name) },
  { id: "king-hydrogen", label: "King Hydrogen", types: kingHydrogen },
  {
    id: "arcane-herb",
    label: "Arcane Herb",
    types: [...arcaneHerbTeas.map((t) => `${t.code} · ${t.name}`), ...arcaneHerbAccessories.map((a) => a.name)],
  },
  { id: "book-store", label: "Book Store (Orrington Publishing)", types: storeBooks.map((b) => (b.note ? `${b.title} (${b.note})` : b.title)) },
  { id: "general", label: "Not sure yet / general question", types: [] },
];

/** Shown first in the Type list: the visitor can ask about a whole range. */
export const ANY_TYPE = "Not sure / the whole range";
