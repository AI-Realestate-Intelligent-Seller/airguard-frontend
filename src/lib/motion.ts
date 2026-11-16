/**
 * The site's motion rules, in one place. Everything that moves should use these, so the whole
 * site feels like one hand made it.
 *
 *   EASE         settle: fast start, long soft landing (entrances, reveals, most UI)
 *   EASE_IN_OUT  travel: for things that move from one place to another (page changes, flights)
 *   DUR.fast     feedback: hover, press, toggles, small swaps            (~0.25 s)
 *   DUR.base     entrances: cards, panels, list items                    (~0.6 s)
 *   DUR.slow     scenes: hero headings, section reveals, large media     (~1.1 s)
 *   STAGGER      delay between siblings in a list
 *
 * CSS twins live in globals.css as --ease-out, --ease-in-out, --dur-fast, --dur-base, --dur-slow.
 * Reduced motion: components drop movement and keep short fades.
 */
export const EASE = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const DUR = { fast: 0.25, base: 0.6, slow: 1.1 } as const;
export const STAGGER = 0.06;
