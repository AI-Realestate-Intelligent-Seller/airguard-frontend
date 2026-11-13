# AirGuard Health — website front end

The AirGuard Health site:
- a single long home page of scroll-driven sections (an animated hero, the founder's journey, the four
  brands, two interactive 3D products, and two films played by the scroll);
- the AirGuard product pages: `/products` (range, XP explorer, fit finder, comparison, FAQs) and
  `/products/xp|mp|lt|ch` (3D anatomy, CFD, technology, specs, research);
- Research & Sources, About, Contact and Terms of Service, and a cart drawer.

The home page was migrated from the "lastest_light mode version" hand-over copy. That copy is kept,
unchanged, next to this folder in the repo for reference.

---

## 1. Quick start

Requirements: **Node.js 20.9 or newer** (developed on Node 22) and npm.

```bash
npm ci            # install exactly the locked versions
npm run dev       # http://localhost:3000
```

| Command             | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Development server (Turbopack)                                  |
| `npm run build`     | Production build                                                |
| `npm run start`     | Serve the production build                                      |
| `npm run lint`      | ESLint (Next.js rules)                                          |
| `npm run typecheck` | Generates Next's route/image types, then runs `tsc --noEmit`    |

There are no environment variables and no back-end calls yet (see §8, *What to connect*).

Generated files (not committed, see `.gitignore`):
- `.next/`
- `next-env.d.ts`
- `*.tsbuildinfo`
- `AGENTS.md`, which `next dev` writes into the project root.

---

## 2. Tech stack

- **Next.js 16** (App Router, Turbopack). `next.config.ts` turns on `cacheComponents` and `partialPrefetching`.
- **React 19**, **TypeScript 5**.
- **Tailwind CSS 4**, with design tokens and section themes in `src/app/globals.css`.
- **motion** (`motion/react`): scroll-linked animation (`useScroll`, `useTransform`) and reveals.
- **three.js 0.169**: the two interactive 3D product views. It loads only when its section comes near.
- **lucide-react**: icons.
- `@base-ui/react` and `class-variance-authority` support the `Button` component; `shadcn` supplies its base styles.

---

## 3. Project structure

```
src/
  app/
    layout.tsx              Root layout: fonts, theme script, header, footer, intro loader
    page.tsx                Home page: the section order (see §4)
    products/page.tsx       AirGuard range: runway, XP explorer, fit finder, compare, proof + FAQs
    products/[model]/       Detail page per model (xp, mp, lt, ch)
    scientific-research/[model]/   Per model: the product hero, Technology, CFD analysis, Scientific research
    research/ about/ contact/ terms-of-service/   Other pages
    globals.css             Tokens, section themes, shared component styles
  components/
    layout/                 Header, footer, products menu, Section + Container wrappers, theme toggle
    sections/               One file per home-page section (see §4)
    three/                  3D scenes (AirGuard XP/MP, LT/CH basic models, King Hydrogen Aurora) and shared zoom control
    products/               /products sections (runway, explorer, fit finder, compare, proof/FAQ)
    product-detail/         /products/[model] sections
    cart/                   Cart drawer and add-to-cart button (state in lib/cart.ts)
    motion/                 Intro loader, reveal, scroll progress, side "chapter" dots, animated logo
    company/ legal/         About/Contact and Terms page bodies
    ui/button.tsx           Button variants
  data/                     All editable content (see §7)
  hooks/                    useIsDesktop, useIsMobile, useMotionPreference, useMenuOpen
  lib/                      utils (cn), theme script, uncoil-path (hero → Journey animation path), cart store
public/
  images/                   All site images (see §6)
  frames/                   Film frame sequences played by the scroll (see §6)
media-source/               Original films and 3D prototypes. NOT served; keep for re-exports
```

The import alias `@/` points to `src/`.

---

## 4. Home page sections (in order)

| # | Section (id)             | File                                           | What it does |
|---|--------------------------|------------------------------------------------|--------------|
| 1 | Hero (`discover`)        | `sections/hero.tsx`, `hero-ring.tsx`           | Headline over a ring of spinning cards. The ring closes as you scroll. On desktop it then breaks open and uncoils down into the Journey's numbered rail. |
| 2 | The Journey (`journey`)  | `sections/family-story.tsx`                    | Founder story and five "Find your path" cards. On desktop the cards stream in from the uncoiling ring, one by one. |
| 3 | Our World (`our-world`)  | `sections/our-world-stage.tsx`, `our-world.tsx`| The four brands. Pinned while scrolling: the heading, then the four cards arrive, then each card opens in turn. |
| 4 | AirGuard XP 3D (`airguard-3d`) | `sections/airguard-3d.tsx`, `three/airguard-xp-scene.ts` | Interactive 3D model. Drag to turn, hover/tap parts, every part labelled, zoom. |
| 5 | Aurora 3D (`aurora-3d`)  | `sections/aurora-3d.tsx`, `three/aurora-scene.ts` | Same pattern for the King Hydrogen Aurora. |
| 6 | Book Store (`book-store`)| `sections/book-store.tsx`, `data/book-store.ts`| *The Throne and Liberty* film played by the scroll, then the shelf of every title with price and store link. |
| 7 | Arcane Herbs (`arcane-herbs`) | `sections/arcane-herbs.tsx`               | Arcane Herbs film played by the scroll, with the brand copy, featured blends and a call to action. |
| 8 | Get in touch (`contact`) | `sections/get-in-touch.tsx`                    | Contact call to action over the team photo, plus the "Proud associates with" logo strip. |

The side dots (`motion/page-interactions.tsx`, `chapters`) list these ids. If you add or remove a
section, update that list too.

### How each section behaves on every screen

Two switches decide which version of a section a screen gets:

**Desktop vs. not desktop.** `useIsDesktop()` is true at **≥ 1024 px** wide.

**Upright vs. landscape (the films).** `PORTRAIT_QUERY` is **`(max-aspect-ratio: 4/5)`**:
- Upright screens (phones, tablets held upright) get the portrait cut of each film.
- Everything else gets the landscape cut.

Pinned sections use `svh` units so mobile browser toolbars don't make them jump.

| Section | Desktop (≥1024) | Tablet / phone | Reduced motion |
|---|---|---|---|
| Hero | Ring closes, then uncoils into the Journey; auto-glides there | Ring closes; no uncoil | No spin or glide |
| Journey | Cards stream in from the ring onto the numbered rail | Normal stacked cards | Static |
| Our World | Opens through a circle over the Journey, cards then open one by one | Pins as it arrives; cards stack; number badges only on the open card | Static |
| 3D sections | Text left, model right. On upright large screens (e.g. iPad Pro portrait) text stacks above the model. Hover a part to highlight it. | Model with **numbered dots** and a tappable **parts list** below. One-finger vertical swipes scroll the page; sideways drags turn the model; two-finger pinch zooms. | No auto-turn |
| Book Store | Landscape film fills the screen edge to edge, **no margins**. The view stays centred. | Portrait film fills the screen below the site bar; its top edge is carried up behind the bar (no gap). Phones held sideways get the landscape film, which follows the book, then pans to the words. Shelf is a horizontal swipe row on phones, 3 columns on tablets. | Shows the final frame still |
| Arcane Herbs | Whole portrait film in a tall column on the right (never cropped), copy on the left. On short screens (≤780 px tall, e.g. Nest Hub) the blend pictures hide; at ≤640 px the three points hide too. | Film fills the screen; copy and blends follow it | Final frame still |
| Get in touch | Team photo behind, white text | Same | Same |
| Footer | Three columns | Phones: address and "Learn More" side by side, "Connect" below | – |

Checked on these sizes on the working copy before cleanup, with no horizontal overflow on any. This clean copy was re-checked on desktop and phone:
- iPhone SE, iPhone 16 and iPhone 16 Pro Max
- Pixel 9 / 9 Pro / 10 and Galaxy A55
- Galaxy Z Fold 6, folded and open
- Pixel 9 Pro Fold
- iPad Mini and iPad Pro 13
- Surface Pro 10
- Nest Hub and Nest Hub Max
- Desktop 1440×900

---

## 5. Theme, motion and accessibility

**Light / dark.**
- The theme is a `dark` class on `<html>`.
- `src/lib/theme.ts` sets it before first paint: the saved choice, otherwise the system setting.
- `theme-toggle.tsx` switches it.
- Sections use Tailwind `dark:` variants.
- The Book Store film swaps to its dark cut when the theme changes.
- Arcane Herbs has only a light film, so in dark mode only its text side turns dark.

**Reduced motion.**
- `useMotionPreference()` follows `prefers-reduced-motion`.
- Pinned films show their final frame, the 3D models don't auto-turn, and reveals become simple fades.

**Screen readers.**
- The films are canvases (`aria-hidden`); their words are repeated in `sr-only` text.
- The 3D stages have `role="img"` with a full parts description.
- Every control has an `aria-label`.

---

## 6. Assets

### Images (`public/images/`)

All images are WebP except the two logo PNGs, and they are served through `next/image`.

| Folder | Contents | Used by |
|---|---|---|
| `brand/` | `airguard-logo-blue.png`, `airguard-logo-white.png` | Header, intro loader, animated logo |
| `site/airguard/` | `product-{xp,mp,lt,ch}.webp`, `feature-{aerosol,fit,innovation}.webp`, `chairside-dental.webp` | Hero ring, products menu, About page |
| `site/journey/` | Journey photos (`dr-james-operatory`, `dental`, `wellness`, …) | Journey section |
| `site/our-world/` | `airguard`, `king-hydrogen`, `book-store`, `arcane-herb` | Our World cards |
| `site/king-hydrogen/` | Edition photos and `aurora-cabinet-crest.webp` (the Aurora 3D door artwork) | Products menu, hero ring, Aurora 3D |
| `site/books/featured/` | Covers used in the menus and hero ring | `data/books.ts` |
| `site/books/store/` | One cover per store title, named after the title | Book Store shelf (`data/book-store.ts`) |
| `site/arcane-herb/` | `tNN-name.webp` tea packs (38 blends), plus the tumbler and pack | `data/arcane-herb-products.ts` |
| `site/about/` | About page portraits and photos | About page |
| `site/contact/team-photo.webp` | Team photo | Get in touch background, hero ring |
| `site/logos/` | `ada`, `ads`, `ces`, `ieee` association logos | Logo strip, About page |

Naming:
- lower-case, words joined with hyphens
- named after what the image shows, not where it is placed
- prefixed with the product code where there is one (`t03-…`, `product-xp`)

### Film frames (`public/frames/`)

Each film is **240 WebP frames** (10 s at 24 fps), named `001.webp` … `240.webp`.

| Folder | Cut | Size per frame |
|---|---|---|
| `the-throne-and-liberty/light` | landscape, light theme | 1280×720 |
| `the-throne-and-liberty/dark` | landscape, dark theme | 1280×720 |
| `the-throne-and-liberty/light-portrait` | portrait, light theme | 720×1280 |
| `the-throne-and-liberty/dark-portrait` | portrait, dark theme | 720×1280 |
| `arcane-herbs` | portrait, light | 720×1280 |

How the films are loaded:
- Each visitor loads **only the one set** their screen and theme need, starting about 1.5 screens before the section.
- Frames load coarse to fine: the last frame first, then every 16th, every 8th and so on, a few at a time.
- So the film can be scrubbed early, and detail fills in as it arrives.
- Neighbouring frames are blended while the scroll eases to rest.

To **replace a film**, keep the same frame count and size and regenerate its folder. The originals
are in `media-source/films/`:

```bash
# landscape (1280×720)
ffmpeg -i media-source/films/the-throne-and-liberty-light-landscape.mp4 \
  -vf "fps=24,scale=1280:-2" -c:v libwebp -quality 70 public/frames/the-throne-and-liberty/light/%03d.webp
# portrait (720×1280)
ffmpeg -i media-source/films/arcane-herbs-light-portrait.mp4 \
  -vf "fps=24,scale=720:-2" -c:v libwebp -quality 70 public/frames/arcane-herbs/%03d.webp
```

A film with a different length needs `FRAMES` changed in the section file.

The section backgrounds are matched to each film's edge colour:
- `EDGE`, `EDGE_TOP` in `book-store.tsx`
- `CREAM` in `arcane-herbs.tsx`

Re-sample them if a new film has a different backdrop.

### Videos

The site plays no video files. Both films are drawn frame by frame on a canvas, so they behave as
part of the page rather than as a player. The source `.mp4`s live in `media-source/films/` only.

### 3D models

- The models are built in code, in `src/components/three/*-scene.ts`, ported from the prototypes in `media-source/3d-prototypes/`.
- There are no model files to load.
- Each scene exports `mount…(stage, { getLabel, onPick, reducedMotion })`. It returns a cleanup function with `zoomIn`, `zoomOut` and `highlight(id)` attached.
- `airguard-xp-scene.ts` is shared by the home page and the product pages. The home page passes `onPick` and `numberedDots: true`; the product pages use `variant` (`xp`/`mp`), `theme`, `getExplode`, `getFocus` and `onSelect`.
- `sections/airguard-3d.tsx` exports both `AirGuard3D` (home section) and `AirGuardStage` (the stage `/products` embeds, with its own part copy in `STAGE_PARTS`).
- Part labels (names and one-liners) live in the `PARTS` array of each section file; the 3D anchor points live in `anchors` in the scene file.
- WebGL is required. If it's unavailable, the stage shows *"The 3D view couldn't load in this browser."*

---

## 7. Content you can edit (`src/data/`)

| File | Holds |
|---|---|
| `book-store.ts` | Store titles, notes, prices, sale prices, store links, `BOOK_STORE_URL` |
| `books.ts` | Featured books used in menus and the hero ring |
| `arcane-herb-products.ts` | All 38 blends (code, name, slug, image) and the featured list |
| `products-menu.ts` | Desktop "Products" mega-menu |
| `airguard-models.ts` | AirGuard XP/MP/LT/CH model data for the product pages |
| `airguard-technology.ts` | Technology and CFD content for the product detail pages |
| `nav.ts` | Header links and footer columns |
| `hero-ring.ts` | Cards on the hero ring (and where each links) |
| `hero-slides.ts` | Hero slide copy |

Page copy that isn't in `data/` lives in the section components themselves:
- Journey cards: `family-story.tsx`
- Brand cards: `our-world.tsx`
- 3D part names: the `PARTS` arrays

---

## 8. What to connect (hand-over checklist)

**Pages that don't exist yet, and where their links point for now.** No internal link returns a 404:

| Was | Now points to |
|---|---|
| `/king-hydrogen`, `/king-hydrogen/{simplestill,founder,aurora,monarch,king-guard}` | `/#aurora-3d` |
| `/arcane-herb`, `/arcane-herb/<slug>` | `/#arcane-herbs` (`arcaneHerbsHref` in `data/arcane-herb-products.ts`) |
| `/book-store` | `/#book-store` (`bookStoreHref` in `data/books.ts`) |
| `/book-store/{30-dias,liquid-assets,king-hydrogen}` | Each title's page on the live store (`data/books.ts`) |
| `/technology` | `/scientific-research/xp#technology` |
| `/faqs` | `/products#faqs` |
| `/xp-models` | `/products/xp` |
| `/news` (footer) | Replaced by **Research** → `/research` |
| `/customer-support` | `/contact` |
| `/donate` (Donate Now) | `/contact` |

When a real page is built, change the link back in `data/nav.ts`, `data/products-menu.ts`,
`data/books.ts` or `components/layout/header.tsx`.

**Contact form** (`components/company/company-pages.tsx`, `prepareEmail`):
- It currently opens the visitor's email app with a pre-filled message to info@airguardhealth.com (`mailto:`).
- Replace it with a POST to your API or form service, and keep the status message.

**Header actions:**
- The **Donate Now** button links to `/contact` until a donation page exists.
- The **cart** opens the cart drawer (`components/cart/`, `lib/cart.ts`); checkout isn't connected to a payment provider.

**Book Store:**
- Prices and links are hard-coded in `data/book-store.ts`.
- They point to the live store at `https://www.airguardhealth.com/orringtonpublishing/p/…`.
- Swap them for your commerce or CMS data if prices should stay in sync.

**Arcane Herbs:**
- "Ask about our 38 blends" scrolls to Get in touch.
- The four featured packs aren't links, because the blend pages don't exist yet.
- The T29 image file name is fixed to *astragalus*, but its URL slug `t29-ginseng-astragulus-tonic` is unchanged in case it matches existing links.

**Social and map links:** in `components/layout/footer.tsx` and `company-pages.tsx`.

---

## 9. Performance notes

- **three.js:** each scene is a separate chunk, imported only when its section is within a screen of view. Rendering pauses whenever a model is off screen or the tab is hidden.
- **Films:** a canvas redraws only when the scroll position changes; the frame loop idles when the section is off screen.
- **Images:** large originals were resized and re-encoded for this copy (the Our World JPEGs are now WebP; About portraits are capped at 1600 px). `next/image` serves responsive sizes.
- **Bundle:** unused sections, components, styles and images from earlier iterations have been removed.

---

## 10. Known notes

- **Lint:** `npm run lint` reports one warning in `components/legal/terms-page.tsx` (a `useEffect` dependency). It is left as is because changing it alters the page's scroll-to-section behaviour; review when you work on that page.
- **Fonts:** fonts are loaded with `next/font` in `app/layout.tsx`.
- **Checks on this copy:**
  - `npm run build` produces all pages (home, products, product details, research, About, Contact, Terms, not-found) with no errors.
  - `npm run typecheck` passes.
  - A production run on desktop and phone found no missing images or frames and no page errors.
