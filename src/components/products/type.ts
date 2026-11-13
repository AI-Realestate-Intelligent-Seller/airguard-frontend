/*
 * One restrained type scale for the product pages: a single sans family, medium-weight headings with
 * tight tracking, modest letter-spacing on small caps, and no decorative serif accents.
 */
export const type = {
  /** Small overline above a heading. */
  eyebrow: "text-xs font-medium uppercase tracking-[0.08em] text-brand-600 dark:text-brand-300",
  h1: "text-4xl font-medium tracking-tight text-navy md:text-5xl",
  h2: "text-3xl font-medium tracking-tight text-navy md:text-4xl",
  h3: "text-lg font-medium tracking-tight text-navy",
  body: "text-[15px] leading-relaxed text-muted-foreground",
  /** Field labels, table headers, meta. */
  label: "text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground",
} as const;
