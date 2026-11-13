import type { StaticImageData } from "next/image";
import throne from "../../public/images/site/books/store/throne-and-liberty.webp";
import liquidAssets from "../../public/images/site/books/store/liquid-assets.webp";
import eatingWell from "../../public/images/site/books/store/the-art-and-science-of-eating-well.webp";
import riseBookOfLife from "../../public/images/site/books/store/king-hydrogen-rise-book-of-life.webp";
import greatKing from "../../public/images/site/books/store/the-great-king-special-edition.webp";
import days30 from "../../public/images/site/books/store/30-days-english.webp";
import dias30 from "../../public/images/site/books/store/30-dias-spanish.webp";
import days30zh from "../../public/images/site/books/store/30-days-chinese.webp";

/** The live Orrington Publishing store (Book Store on airguardhealth.com). */
export const BOOK_STORE_URL = "https://www.airguardhealth.com/orringtonpublishing";

export type StoreBook = {
  id: string;
  title: string;
  /** Edition or format, shown under the title. */
  note?: string;
  /** Price in US dollars; `was` is the price before a sale. */
  price: number;
  was?: number;
  cover: StaticImageData;
  href: string;
  /** Language of the title, when it isn't English. */
  lang?: string;
};

const p = (slug: string) => `${BOOK_STORE_URL}/p/${slug}`;

/** Every book in the store (the King Hydrogen machines listed there are left out), featured title first. */
export const storeBooks: StoreBook[] = [
  { id: "throne-and-liberty", title: "The Throne and Liberty", note: "Audiobook", price: 10, cover: throne, href: p("the-throne-and-liberty-audiobook") },
  { id: "liquid-assets", title: "Liquid Assets", note: "How to make money by drinking water", price: 5, cover: liquidAssets, href: p("liquid-assets") },
  { id: "great-king", title: "The Great King: King Hydrogen", note: "Special Edition", price: 5, cover: greatKing, href: p("the-great-king-king-hydrogen-special-edition") },
  { id: "rise-book-of-life", title: "King Hydrogen: Rise, Book of Life", price: 15, cover: riseBookOfLife, href: p("king-hydrogen-rise-book-of-life") },
  { id: "eating-well", title: "The Art and Science of Eating Well", price: 5, cover: eatingWell, href: p("the-art-and-science-of-eating-well") },
  { id: "30-days", title: "30 Days", note: "Guarantee you will improve", price: 10, was: 20, cover: days30, href: p("30-days-guarantee-you-will-improve") },
  { id: "30-dias", title: "30 Días", note: "Garantía mejorarás · Spanish", price: 10, was: 15, cover: dias30, href: p("30-das-garanta-mejorars"), lang: "es" },
  { id: "30-days-zh", title: "30 天保證您會有所進步", note: "Chinese edition", price: 10, was: 15, cover: days30zh, href: p("30-"), lang: "zh" },
];
