"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, FlaskConical, Hand, Pause, Play } from "lucide-react";
import { productsMenu } from "@/data/products-menu";
import { airguardModels, type ModelId } from "@/data/airguard-models";
import { formatUsd } from "@/lib/cart";
import { AddToCart } from "@/components/cart/add-to-cart";
import { type } from "@/components/products/type";
import { ModelViewer } from "@/components/products/model-viewer";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";

/*
 * The products runway: AirGuard models standing on a turning 3D ring, adapted from the
 * MotionSites "outfit carousel" (Try the Look runway). The ring math is the template's:
 * perspective depth, outer models smaller, higher and blurred, a critically damped spring
 * (K 95), a 5 s autoplay with a filling progress tick, drag / swipe, arrow keys, a custom
 * "Drag / View" cursor and a light sweep on each change. The right panel ("In this model")
 * swaps to the front model's claims-safe copy.
 *
 * Brand pills sit above it. Only AirGuard has its full product journey on this page for now;
 * the other three pills dim the ring and show a short teaser linking to their home sections.
 *
 * Clicking a model (or "View in 3D" in the panel) opens its 3D model right in the stage: the
 * ring blurs away and the model is revealed in a circle growing from the click point. The
 * "Explore products" bar (or Escape) closes it back to the ring.
 *
 * Positions are written straight to the DOM from one rAF loop (no React state per frame).
 */

type BrandId = "airguard" | "king-hydrogen" | "arcane-herb" | "book-store";

const EASE = [0.16, 1, 0.3, 1] as const;
const MODELS = airguardModels;
const n = MODELS.length;
/** Bodies on the ring: the models repeated so the ring always looks full. */
const N = n * Math.ceil(8 / n);
const STEP = (Math.PI * 2) / N;
/** The front model stands this much taller; models away from the front shrink to SIDE. */
const FS = 1.08;
const SIDE = 0.6;
/** Extra zoom the front model springs into once it has arrived at the front. */
const ZOOM = 0.12;
const K = 95;
const C = 2 * Math.sqrt(K); // critically damped: settles without overshoot
const SPEED = 5000;
/** On first view the ring turns this many steps into place. */
const ENTRY = 1.15;
/** Width / height of each model's frame; the product shots are landscape. */
const FIG_AR = 1.6;

const mod = (a: number, m: number) => ((a % m) + m) % m;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Claims register A-001; the other brands use their products-menu blurb. */
const airguardIntro = "AirGuard offers four models: XP, MP, LT and CH.";

/** Until each brand has its own journey here, its pill points to its section on the home page. */
const brandHome: Record<Exclude<BrandId, "airguard">, string> = {
  "king-hydrogen": "/#hydrogen",
  "arcane-herb": "/#herb",
  "book-store": "/#books",
};

type Api = { next: () => void; prev: () => void; go: (i: number) => void };
/** The model open in 3D, and where its reveal circle grows from (stage px). */
type Viewing = { id: ModelId; x: number; y: number; r: number };

export function ProductRunway() {
  const reduce = useMotionPreference();
  const [brand, setBrand] = useState<BrandId>("airguard");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  /** Bumped to restart the autoplay bar and timer without changing model. */
  const [cycle, setCycle] = useState(0);
  const [sweep, setSweep] = useState(0);
  const [hasCursor, setHasCursor] = useState(false);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const api = useRef<Api | null>(null);
  /** Shared with the autoplay timer: what should hold the current model. */
  const holds = useRef({ visible: true, dragging: false, panelHover: false, viewing: false });

  const model = MODELS[index];
  const isAirGuard = brand === "airguard";
  const column = productsMenu.find((c) => c.id === brand)!;

  /** Open a model's 3D view, revealed from (x, y) in the stage; defaults to the stage centre. */
  const openViewer = (id: ModelId, at?: { x: number; y: number }) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = at?.x ?? r.width / 2;
    const y = at?.y ?? r.height / 2;
    setViewing({ id, x, y, r: Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 20 });
  };
  const closeViewer = () => setViewing(null);
  const openRef = useRef(openViewer);
  useEffect(() => {
    openRef.current = openViewer;
  });
  useEffect(() => {
    holds.current.viewing = !!viewing;
    if (!viewing) return;
    backRef.current?.focus({ preventScroll: true });
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setViewing(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewing]);

  // ── The ring engine: measure, spring, render, drag, cursor ──
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const e = {
      cur: reduced ? 0 : -ENTRY,
      target: 0,
      vel: 0,
      W: 0,
      H: 0,
      figW: 0,
      unit: 120,
      raf: 0,
      last: 0,
      index: 0,
      zoom: 0,
      zv: 0,
    };

    const render = () => {
      const { W, H } = e;
      if (!W) return;
      const mobile = W < 640;
      const R = W * (mobile ? 0.56 : 0.46);
      const P = W * (mobile ? 1.9 : 1.65);
      const floor = H - (mobile ? 30 : 46);
      const horizon = H * 0.4;
      const cx = W / 2;
      for (let a = 0; a < N; a++) {
        const el = bodyRefs.current[a];
        if (!el) continue;
        let phi = ((a - e.cur) * STEP) % (Math.PI * 2);
        if (phi > Math.PI) phi -= Math.PI * 2;
        if (phi <= -Math.PI) phi += Math.PI * 2;
        const z = R * (1 - Math.cos(phi));
        const persp = P / (P + z);
        const sl = Math.abs(phi) / STEP;
        // Front model full size (and zoomed once it lands), the rest smaller.
        const scale = persp * (SIDE + (FS - SIDE) * clamp01(1 - sl)) * (1 + ZOOM * e.zoom * clamp01(1 - sl * 2));
        const x = cx + R * Math.sin(phi) * persp;
        const bottom = H - (horizon + (floor - horizon) * persp);
        const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
        let opacity = clamp01((Math.cos(phi) + 0.55) / 0.3);
        const half = (e.figW * scale) / 2;
        if (x + half < -4 || x - half > W + 4) opacity = 0;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${(-bottom).toFixed(1)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
        el.style.pointerEvents = opacity < 0.5 ? "none" : "auto";
        el.style.zIndex = String(Math.round(scale * 1000));
        const b = Math.round(blur * 10) / 10;
        el.style.filter = b > 0.05 ? `blur(${b}px)` : "";
        el.dataset.front = sl < 0.5 ? "1" : "0";
      }
    };

    const tick = (now: number) => {
      const dt = e.last ? Math.min(0.034, (now - e.last) / 1000) : 1 / 60;
      e.last = now;
      if (reduced) {
        e.cur = e.target;
        e.vel = 0;
      } else {
        const h = dt / 3;
        for (let i = 0; i < 3; i++) {
          const acc = -K * (e.cur - e.target) - C * e.vel;
          e.vel += acc * h;
          e.cur += e.vel * h;
        }
      }
      const settled = Math.abs(e.cur - e.target) <= 0.0005 && Math.abs(e.vel) <= 0.0005;
      if (settled) {
        e.cur = e.target;
        e.vel = 0;
      }
      // Arrival zoom: once the ring rests, the front model springs in a touch closer (slight
      // overshoot); as soon as the ring moves again it eases straight back.
      const zt = settled && !holds.current.dragging ? 1 : 0;
      if (reduced) {
        e.zoom = zt;
        e.zv = 0;
      } else if (zt) {
        const h = dt / 3;
        for (let i = 0; i < 3; i++) {
          e.zv += (-140 * (e.zoom - 1) - 14 * e.zv) * h;
          e.zoom += e.zv * h;
        }
      } else {
        e.zoom += (0 - e.zoom) * Math.min(1, dt * 14);
        e.zv = 0;
      }
      const zoomed = Math.abs(e.zoom - zt) < 0.001 && Math.abs(e.zv) < 0.001;
      if (zoomed) e.zoom = zt;
      render();
      if (settled && zoomed && !holds.current.dragging) {
        e.raf = 0;
        e.last = 0;
        return;
      }
      e.raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!e.raf && holds.current.visible) e.raf = requestAnimationFrame(tick);
    };

    const moveTo = (T: number) => {
      e.target = T;
      const i = mod(Math.round(T), n);
      if (i !== e.index) {
        e.index = i;
        setIndex(i);
        setSweep((s) => s + 1);
      }
      kick();
    };
    api.current = {
      next: () => moveTo(Math.round(e.target) + 1),
      prev: () => moveTo(Math.round(e.target) - 1),
      go: (i) => {
        let d = mod(i - e.index, n);
        if (d > n / 2) d -= n;
        moveTo(Math.round(e.target) + d);
      },
    };

    const measure = () => {
      const r = stage.getBoundingClientRect();
      e.W = r.width;
      e.H = r.height;
      const mobile = e.W < 640;
      const byHeight = ((e.H - 70) * FIG_AR) / (FS * (1 + ZOOM));
      e.figW = Math.max(160, Math.min(e.W * (mobile ? 0.72 : 0.5), byHeight, 720));
      e.unit = Math.max(mobile ? 90 : 120, e.W * 0.3);
      stage.style.setProperty("--runway-fig-w", `${e.figW.toFixed(0)}px`);
      render();
      kick();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    const io = new IntersectionObserver(([entry]) => {
      holds.current.visible = entry.isIntersecting;
      if (entry.isIntersecting) kick();
    });
    io.observe(stage);

    // Drag / swipe. A press that barely moves is a click on a model.
    let press: { x: number; y: number; t: number; body: number | null; moved: boolean; id: number } | null = null;
    const bodyAt = (t: EventTarget | null) => {
      const el = (t as HTMLElement | null)?.closest?.<HTMLElement>("[data-rw-body]");
      return el ? Number(el.dataset.rwBody) : null;
    };
    const onDown = (ev: PointerEvent) => {
      if (ev.button !== 0 || holds.current.viewing) return; // the 3D model takes the pointer

      press = { x: ev.clientX, y: ev.clientY, t: e.target, body: bodyAt(ev.target), moved: false, id: ev.pointerId };
    };
    const onMove = (ev: PointerEvent) => {
      moveCursor(ev);
      if (!press || ev.pointerId !== press.id) return;
      const dx = ev.clientX - press.x;
      const dy = ev.clientY - press.y;
      if (!press.moved) {
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
        press.moved = true;
        holds.current.dragging = true;
        stage.dataset.dragging = "1";
        stage.setPointerCapture(ev.pointerId);
      }
      moveTo(press.t - dx / e.unit);
    };
    const onUp = (ev: PointerEvent) => {
      if (!press || ev.pointerId !== press.id) return;
      const p = press;
      press = null;
      if (p.moved) {
        holds.current.dragging = false;
        delete stage.dataset.dragging;
        moveTo(Math.round(e.target));
        setCycle((c) => c + 1);
        return;
      }
      if (p.body === null) return;
      // A click on any model brings it to the front and opens its 3D view from that spot.
      let k = mod(p.body - Math.round(e.target), N);
      if (k > N / 2) k -= N;
      if (k !== 0) moveTo(Math.round(e.target) + k);
      const r = stage.getBoundingClientRect();
      openRef.current(MODELS[mod(p.body, n)].id, { x: ev.clientX - r.left, y: ev.clientY - r.top });
    };
    const onCancel = () => {
      if (press?.moved) moveTo(Math.round(e.target));
      press = null;
      holds.current.dragging = false;
      delete stage.dataset.dragging;
    };

    // Custom cursor, for mouse and trackpad only.
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    setHasCursor(fine);
    const cur = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, on: false };
    const followCursor = () => {
      const el = cursorRef.current;
      if (!el) return;
      const k = reduced ? 1 : 0.18;
      cur.x += (cur.tx - cur.x) * k;
      cur.y += (cur.ty - cur.y) * k;
      el.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
      cur.raf = Math.hypot(cur.tx - cur.x, cur.ty - cur.y) > 0.2 ? requestAnimationFrame(followCursor) : 0;
    };
    function moveCursor(ev: PointerEvent) {
      const el = cursorRef.current;
      if (!fine || !el || ev.pointerType !== "mouse" || holds.current.viewing) return;
      const r = stage!.getBoundingClientRect();
      cur.tx = ev.clientX - r.left;
      cur.ty = ev.clientY - r.top;
      if (!cur.on || el.dataset.on !== "1") {
        // first entry, or the element was remounted after the 3D view closed
        cur.on = true;
        cur.x = cur.tx;
        cur.y = cur.ty;
        el.dataset.on = "1";
      }
      const overBody = (ev.target as HTMLElement).closest?.<HTMLElement>("[data-rw-body]");
      el.dataset.mode = holds.current.dragging ? "grab" : overBody ? "view" : "drag";
      if (!cur.raf) cur.raf = requestAnimationFrame(followCursor);
    }
    const onLeave = () => {
      cur.on = false;
      if (cursorRef.current) cursorRef.current.dataset.on = "0";
    };

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onCancel);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(e.raf);
      cancelAnimationFrame(cur.raf);
      ro.disconnect();
      io.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onCancel);
      stage.removeEventListener("pointerleave", onLeave);
      api.current = null;
    };
  }, []);

  // ── Autoplay: one model every 5 s; holds while dragged, hovered, hidden or off screen ──
  const autoplay = playing && !reduce && isAirGuard && !viewing;
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => {
      const h = holds.current;
      if (h.visible && !h.dragging && !h.panelHover && !document.hidden) api.current?.next();
      else setCycle((c) => c + 1);
    }, SPEED);
    return () => window.clearTimeout(id);
  }, [autoplay, index, cycle]);

  /** A visitor acting on a model stops autoplay for good. */
  const engage = () => setPlaying(false);

  return (
    <section
      aria-labelledby="products-title"
      className="relative isolate overflow-hidden bg-background pt-[72px] md:pt-[108px] lg:h-[100svh] lg:min-h-[720px]"
    >
      <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ── Left: head, stage, controls ── */}
        <div className="relative flex min-w-0 flex-col">
          <div className="relative z-10 flex flex-col gap-5 px-5 pt-6 md:px-10 lg:px-14 lg:pt-8">
            <BrandPills
              brand={brand}
              onChange={(b) => {
                setBrand(b);
                setViewing(null);
                if (b === "airguard") setCycle((c) => c + 1);
              }}
            />
            <div className="flex flex-col gap-2">
              <motion.h1
                id="products-title"
                initial={reduce ? false : { opacity: 0, y: 22, filter: "blur(8px)", letterSpacing: "0.03em" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", letterSpacing: "-0.025em" }}
                transition={{ duration: 1.4, delay: 0.12, ease: EASE }}
                className="text-4xl font-medium tracking-tight text-navy md:text-5xl"
              >
                AirGuard products
              </motion.h1>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={brand}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground"
                >
                  {isAirGuard ? airguardIntro : column.blurb}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Stage */}
          <div
            ref={stageRef}
            tabIndex={isAirGuard ? 0 : -1}
            role="region"
            aria-roledescription="carousel"
            aria-label="AirGuard models. Use the arrow keys or swipe to change model."
            data-cursor={hasCursor && isAirGuard && !viewing ? "1" : undefined}
            onKeyDown={(ev) => {
              if (viewing) return;
              if (ev.key === "Enter" && isAirGuard) openViewer(model.id); // keyboard way into the 3D view
              if (ev.key === "ArrowRight") api.current?.next();
              if (ev.key === "ArrowLeft") api.current?.prev();
            }}
            className="runway-stage relative h-[56svh] min-h-[320px] flex-1 overflow-hidden outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--brand-400)] lg:h-auto lg:min-h-0"
          >
            {/* floor and atmosphere */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_78%,#ffffff_0%,#eef2f9_55%,transparent_100%)] dark:bg-[radial-gradient(70%_55%_at_50%_78%,#1f304f_0%,#172236_60%,transparent_100%)]"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-[8%] bottom-[30px] h-px bg-gradient-to-r from-transparent via-navy/15 to-transparent md:bottom-[46px]" />

            {/* model code watermark behind the ring */}
            <AnimatePresence initial={false}>
              {isAirGuard && (
                <motion.span
                  key={model.id}
                  aria-hidden="true"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, letterSpacing: "0.2em" }}
                  animate={{ opacity: 1, y: 0, letterSpacing: "-0.04em" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -40 }}
                  transition={{ duration: 1.1, ease: EASE }}
                  className="pointer-events-none absolute inset-x-0 top-[4%] select-none text-center text-[26vw] font-bold leading-none text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--brand-500)_22%,transparent)] lg:top-[2%] lg:text-[17vw]"
                >
                  {model.code}
                </motion.span>
              )}
            </AnimatePresence>

            {/* the ring */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-0"
              animate={
                viewing
                  ? { opacity: 0, scale: 0.9, filter: "blur(14px)" }
                  : isAirGuard
                    ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                    : { opacity: reduce ? 0 : 0.14, scale: 0.94, filter: "blur(10px)" }
              }
              transition={{ duration: 0.9, ease: EASE }}
              style={{ pointerEvents: isAirGuard && !viewing ? "auto" : "none" }}
            >
              {Array.from({ length: N }, (_, a) => {
                const m = MODELS[a % n];
                return (
                  <div
                    key={a}
                    ref={(el) => {
                      bodyRefs.current[a] = el;
                    }}
                    data-rw-body={a}
                    className="runway-body"
                  >
                    <span className="runway-shadow" />
                    <div className="relative w-[var(--runway-fig-w,420px)]" style={{ aspectRatio: FIG_AR }}>
                      <Image
                        src={m.image}
                        alt=""
                        fill
                        draggable={false}
                        preload={a === 0}
                        loading="eager"
                        sizes="(min-width: 1024px) 40vw, 74vw"
                        className="pointer-events-none select-none object-contain object-bottom"
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* light sweep, replayed per change */}
            <span key={sweep} aria-hidden="true" data-run={sweep > 0 && !reduce ? "1" : "0"} className="runway-sweep" />

            {/* other brands: a short teaser over the dimmed ring */}
            <AnimatePresence>
              {!isAirGuard && <BrandTeaser key={brand} brand={brand} />}
            </AnimatePresence>

            {/* the clicked model in 3D, revealed in a circle growing from the click */}
            <AnimatePresence>
              {viewing && (
                <motion.div
                  key={viewing.id}
                  className="absolute inset-0 z-[1650]"
                  initial={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${viewing.x}px ${viewing.y}px)` }}
                  animate={reduce ? { opacity: 1 } : { clipPath: `circle(${viewing.r}px at ${viewing.x}px ${viewing.y}px)` }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0.2 } }
                      : { clipPath: `circle(0px at ${viewing.x}px ${viewing.y}px)`, transition: { duration: 0.6, ease: EASE } }
                  }
                  transition={{ duration: 1.1, ease: EASE }}
                >
                  <ModelViewer id={viewing.id} />
                </motion.div>
              )}
            </AnimatePresence>

            {hasCursor && isAirGuard && !viewing && (
              <span ref={cursorRef} aria-hidden="true" data-mode="drag" data-ring={!reduce ? "1" : undefined} className="runway-cursor">
                <span className="runway-cursor-in">
                  <span className="runway-cursor-label runway-cursor-drag">Drag</span>
                  <span className="runway-cursor-label runway-cursor-view">View 3D</span>
                </span>
              </span>
            )}
          </div>

          {/* Controls; while a model is open in 3D, the "Explore products" bar takes their place */}
          <div className="relative z-10">
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: viewing ? 0 : isAirGuard ? 1 : 0.35 }}
            transition={{ duration: viewing ? 0.3 : 1.2, delay: reduce || viewing ? 0 : 0.55 }}
            className={cn("relative flex items-center gap-3 px-3 pb-4 md:gap-5 md:px-10 lg:px-11 lg:pb-7", (!isAirGuard || viewing) && "pointer-events-none")}
            style={{ ["--runway-speed" as string]: `${SPEED}ms` }}
            inert={!isAirGuard || !!viewing}
          >
            <RoundIcon label="Previous model" onClick={() => api.current?.prev()}>
              <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover:-translate-x-1">
                <path d="M25 7H1M7 1L1 7l6 6" />
              </svg>
            </RoundIcon>
            <div className="flex min-w-0 flex-1 gap-1.5">
              {MODELS.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  aria-current={i === index}
                  aria-label={`Model ${i + 1}: ${m.name}`}
                  data-past={i < index ? "1" : "0"}
                  data-run={autoplay ? "1" : "0"}
                  onClick={() => api.current?.go(i)}
                  className="runway-tick flex h-11 flex-col justify-center gap-2 text-left text-muted-foreground hover:text-navy aria-[current=true]:text-navy"
                >
                  <span key={i === index ? `${index}-${cycle}` : i} className="runway-tick-bar" />
                  <span className="truncate text-[10px] uppercase tracking-[0.08em] tabular-nums">
                    0{i + 1}
                    <span className="runway-tick-name">&nbsp;&nbsp;{m.name}</span>
                  </span>
                </button>
              ))}
            </div>
            <RoundIcon label={autoplay ? "Pause autoplay" : "Play autoplay"} pressed={autoplay} onClick={() => setPlaying((p) => !p)}>
              {autoplay ? <Pause className="size-3.5 fill-current" strokeWidth={0} /> : <Play className="size-3.5 fill-current" strokeWidth={0} />}
            </RoundIcon>
            <RoundIcon label="Next model" onClick={() => api.current?.next()}>
              <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover:translate-x-1">
                <path d="M1 7h24M19 1l6 6-6 6" />
              </svg>
            </RoundIcon>
          </motion.div>
          <AnimatePresence>
            {viewing && (
              <motion.div
                key="viewer-bar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: reduce ? 0 : 0.35, ease: EASE } }}
                exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
                className="absolute inset-0 flex items-center justify-between gap-3 px-3 pb-4 md:px-10 lg:px-11 lg:pb-7"
              >
                <button
                  ref={backRef}
                  type="button"
                  onClick={closeViewer}
                  className="group inline-flex h-11 items-center gap-2 rounded-full border border-navy/15 bg-card px-5 text-sm font-medium text-navy shadow-[0_10px_24px_-16px_rgba(23,34,54,0.5)] hover:border-brand-500 hover:text-brand-500 focus-visible:outline-2 focus-visible:outline-brand-400"
                >
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                  Explore products
                </button>
                <p className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground sm:flex">
                  <Hand className="size-3.5" aria-hidden="true" />
                  {MODELS.find((m) => m.id === viewing.id)?.name} · Drag to turn
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {viewing ? `${model.name}, 3D view. Press Escape to go back.` : isAirGuard ? `Model ${index + 1} of ${n}: ${model.name}` : column.brand}
          </span>
        </div>

        {/* ── Right: "In this model" panel ── */}
        <motion.aside
          aria-label={isAirGuard ? `${model.name} details` : `${column.brand} overview`}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: reduce ? 0 : 0.25 }}
          onPointerEnter={(ev) => {
            if (ev.pointerType === "mouse") holds.current.panelHover = true;
          }}
          onPointerLeave={() => {
            if (!holds.current.panelHover) return;
            holds.current.panelHover = false;
            setCycle((c) => c + 1);
          }}
          className="relative flex min-h-0 flex-col border-t border-border bg-card/60 backdrop-blur-sm lg:border-l lg:border-t-0"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 pb-6 pt-8 md:px-10 lg:px-8 lg:pt-10">
            {/* popLayout: the next panel enters at once while the last one fades out over it */}
            <AnimatePresence mode="popLayout" initial={false}>
              {isAirGuard ? <ModelPanel key={model.id} index={index} /> : <BrandPanel key={brand} brand={brand} />}
            </AnimatePresence>
          </div>
          {isAirGuard && (
            <div className="flex flex-col gap-3 border-t border-border px-6 py-5 md:px-10 lg:px-8">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{model.name}</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={model.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="text-2xl font-medium tabular-nums text-navy"
                  >
                    {model.price === null ? <span className="text-sm font-normal text-muted-foreground">Price on request</span> : formatUsd(model.price)}
                  </motion.span>
                </AnimatePresence>
              </div>
              <AddToCart id={model.id} onAdd={engage} className="max-lg:hidden" />
            </div>
          )}
        </motion.aside>
      </div>
    </section>
  );
}

function BrandPills({ brand, onChange }: { brand: BrandId; onChange: (b: BrandId) => void }) {
  const reduce = useMotionPreference();
  return (
    <LayoutGroup id="brand-pills">
      <div role="tablist" aria-label="Product families" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {productsMenu.map((c, i) => {
          const active = c.id === brand;
          return (
            <motion.button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(c.id as BrandId)}
              initial={reduce ? false : { opacity: 0, y: 14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.05 + i * 0.07, ease: EASE }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "relative shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                active ? "border-transparent text-white" : "border-border text-navy/70 hover:border-navy/30 hover:text-navy"
              )}
            >
              {active && (
                <motion.span
                  layoutId="brand-pill"
                  className="absolute inset-0 rounded-full shadow-[0_10px_24px_-12px_rgba(23,34,54,0.6)]"
                  style={{ backgroundColor: c.accent }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 rounded-full", active ? "bg-[#fff]" : "")}
                  style={active ? undefined : { backgroundColor: c.accent }}
                />
                {c.brand}
                {c.id !== "airguard" && (
                  <span className={cn("text-[9px] uppercase tracking-[0.08em]", active ? "text-white/70" : "text-muted-foreground")}>Soon</span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function ModelPanel({ index }: { index: number }) {
  const reduce = useMotionPreference();
  const m = MODELS[index];
  const rise = (i: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay: 0.06 * i, ease: EASE },
        };
  return (
    <motion.div exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }} className="flex flex-col bg-transparent [&[style*='position']]:pointer-events-none">
      <motion.p {...rise(0)} className={type.eyebrow}>
        {m.role}
      </motion.p>
      <motion.div {...rise(1)} className="mt-2 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-medium tracking-tight text-navy md:text-3xl">{m.name}</h2>
        {/* Phones and tablets: add to cart right here (the Shop now bar below is desktop only) */}
        <AddToCart id={m.id} variant="icon" className="lg:hidden" />
      </motion.div>
      <motion.p {...rise(2)} className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {m.value}
      </motion.p>
      <ul className="mt-5 border-b border-border">
        {m.features.map((f, i) => (
          <motion.li key={f.label} {...rise(3 + i)} className="flex items-center gap-3 border-t border-border py-2.5 text-sm text-navy">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand-500" />
            {f.label}
          </motion.li>
        ))}
      </ul>
      <motion.p {...rise(3 + m.features.length)} className="mt-4 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-navy">Best for: </span>
        {m.bestFor}
      </motion.p>
      <motion.div {...rise(4 + m.features.length)} className="mt-4">
        <Link
          href={`/scientific-research/${m.id}`}
          className="group inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-300"
        >
          <FlaskConical className="size-4" aria-hidden="true" />
          Scientific research
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </motion.div>
    </motion.div>
  );
}

function BrandPanel({ brand }: { brand: BrandId }) {
  const column = productsMenu.find((c) => c.id === brand)!;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex flex-col"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: column.accent }}>
        {column.blurb}
      </p>
      <h2 className="mt-2 text-2xl font-medium tracking-tight text-navy md:text-3xl">{column.brand}</h2>
      <ul className="mt-5 border-b border-border">
        {column.items.map((item) => (
          <li key={item.name} className="border-t border-border py-3">
            <span className="block text-sm font-medium text-navy">{item.name}</span>
            <span className="block text-xs text-muted-foreground">{item.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Coming soon to this page.
      </p>
    </motion.div>
  );
}

function BrandTeaser({ brand }: { brand: Exclude<BrandId, "airguard"> }) {
  const reduce = useMotionPreference();
  const column = productsMenu.find((c) => c.id === brand)!;
  const shots = column.items.filter((i) => i.image).slice(0, 5);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      className="absolute inset-0 z-[1600] flex flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <div className="flex items-end justify-center">
        {shots.map((s, i) => {
          const mid = (shots.length - 1) / 2;
          return (
            <motion.div
              key={s.name}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, rotate: (i - mid) * 10, scale: 0.8 }}
              animate={{ opacity: 1, y: Math.abs(i - mid) * 10, rotate: (i - mid) * 6, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.08 * i, ease: EASE }}
              className="relative -mx-2 size-20 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_18px_30px_-18px_rgba(23,34,54,0.6)] md:size-28 dark:border-white/10"
            >
              <Image src={s.image!} alt="" fill sizes="112px" className="object-cover" />
            </motion.div>
          );
        })}
      </div>
      <div className="max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: column.accent }}>
          Coming to this page
        </p>
        <p className="mt-2 text-2xl font-medium text-navy md:text-3xl">{column.brand}</p>
      </div>
      <Link
        href={brandHome[brand]}
        className="group inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white/80 px-5 py-2.5 text-sm font-medium text-navy backdrop-blur hover:border-navy/30 dark:bg-white/5"
      >
        Explore {column.brand} on our home page
        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}

function RoundIcon({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="group relative grid size-11 shrink-0 place-items-center rounded-full text-navy before:absolute before:inset-0.5 before:scale-[.55] before:rounded-full before:border before:border-current before:opacity-0 before:transition-[transform,opacity] before:duration-700 before:[transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:before:scale-100 hover:before:opacity-25 active:[&>svg]:scale-90 focus-visible:outline-2 focus-visible:outline-brand-400"
    >
      {children}
    </button>
  );
}
