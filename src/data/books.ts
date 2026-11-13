import { BOOK_STORE_URL } from "./book-store";
import type { StaticImageData } from "next/image";
import dias30 from "../../public/images/site/books/featured/30-dias.webp";
import liquidAssets from "../../public/images/site/books/featured/liquid-assets.webp";
import kingHydrogenBook from "../../public/images/site/books/featured/the-great-king.webp";

export type Book = {
  id: string;
  title: string;
  /** Short form used where the full title would wrap badly, e.g. the nav. */
  shortTitle: string;
  subtitle: string;
  author: string;
  cover: StaticImageData;
  href: string;
  /** Spine colour, sampled from the cover, for the 3D edge in the hero. */
  spine: string;
};

/** Orrington Publishing titles. One source for the nav, hero and carousel. */
export const books: Book[] = [
  {
    id: "30-dias",
    title: "30 Días",
    shortTitle: "30 Días",
    subtitle: "Garantiza que mejorarás",
    author: "Dr. James Orrington",
    cover: dias30,
    href: `${BOOK_STORE_URL}/p/30-das-garanta-mejorars`,
    spine: "#2d4a63",
  },
  {
    id: "liquid-assets",
    title: "Liquid Assets",
    shortTitle: "Liquid Assets",
    subtitle: "How to make money by drinking water",
    author: "Dr. James Orrington",
    cover: liquidAssets,
    href: `${BOOK_STORE_URL}/p/liquid-assets`,
    spine: "#2b6a86",
  },
  {
    id: "king-hydrogen",
    title: "The Great King: King Hydrogen",
    shortTitle: "The Great King",
    subtitle: "Special Edition",
    author: "Dr. James Orrington",
    cover: kingHydrogenBook,
    href: `${BOOK_STORE_URL}/p/the-great-king-king-hydrogen-special-edition`,
    spine: "#121a2e",
  },
];

/** The home page Book Store section (each title above links to its page on the live store). */
export const bookStoreHref = "/#book-store";
