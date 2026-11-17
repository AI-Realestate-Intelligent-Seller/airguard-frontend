/*
 * The Genesis drop's trip into King Hydrogen. At the end of the story the particle drop (WebGL,
 * inside the story section) is swapped, in the same frame, for this copy of it: the same teardrop
 * of dots, the same two colours, size and place, drawn on a 2D canvas pinned over the whole screen.
 * The page then scrolls on underneath while the drop falls onto the sea at the top of the next
 * section, where it melts into the waves (no splash): it flattens onto the surface, spreads along
 * it and fades, and the section's own reveal takes over from there (dropBus).
 * Using a fresh overlay rather than moving the WebGL canvas keeps it clear of the clipped and
 * transformed wrappers the story section sits in.
 */

/** The drop's colours (chapter 3 of the genesis palette in particle-story.ts) and its group split. */
const COLORS = { light: ["#3d93ec", "#1f66cf"], dark: ["#bfe6ff", "#6fc3ff"] } as const;
const SPLIT = 0.34;
/** World units per screen height in the story (2 · tan(22.5°) · camera z of 12). */
const WORLD_H = 2 * Math.tan((22.5 * Math.PI) / 180) * 12;

const FALL = 1250; // ms
const MERGE = 900; // ms for the drop to melt into the waves

type Dot = { x: number; y: number; z: number; a: boolean; s: number; vx: number; vy: number };

/** Dots of the teardrop, in world units around its centre (the shape of f3 in particle-story.ts). */
function teardrop(n: number): Dot[] {
  const dots: Dot[] = [];
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.acos(2 * Math.random() - 1);
    let x = Math.sin(v) * Math.cos(u);
    let y = Math.cos(v);
    let z = Math.sin(v) * Math.sin(u);
    const r = 1.25 * (0.82 + 0.18 * Math.pow(Math.random(), 0.3));
    if (y > 0) {
      y *= 1.75;
      x *= 1 - y / 2.2;
      z *= 1 - y / 2.2;
    }
    x *= r;
    y *= r;
    z *= r;
    // burst velocity: outward from the centre, with some spread
    const len = Math.hypot(x, y, z) || 1;
    const sp = 0.6 + Math.random() * 1.1;
    dots.push({ x, y, z, a: Math.random() < SPLIT, s: 0.55 + Math.random(), vx: (x / len) * sp + (Math.random() - 0.5) * 0.5, vy: (y / len) * sp + (Math.random() - 0.5) * 0.5 });
  }
  return dots;
}

export function carryDrop(opts: {
  /** The drop's centre on screen when it is handed over (px). */
  from: { x: number; y: number };
  /** The story canvas's height in px (sets the drop's size). */
  storyHeight: number;
  /** Scroll position to glide to (the top of the next section). */
  scrollTo: number;
  dark: boolean;
  small: boolean;
  /** The drop has reached the sea in the next section and melts into it (viewport px). */
  onLand: (x: number, y: number) => void;
}) {
  const { from, storyHeight, scrollTo, dark, small, onLand } = opts;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100vw", height: "100svh", zIndex: "75", pointerEvents: "none" });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio, 2);
  const W = innerWidth;
  const H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  if (!ctx) {
    canvas.remove();
    window.scrollTo({ top: scrollTo, behavior: "smooth" });
    onLand(W / 2, H / 2);
    return () => {};
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const unit = storyHeight / WORLD_H; // px per world unit
  const dots = teardrop(small ? 900 : 1600);
  const [cA, cB] = dark ? COLORS.dark : COLORS.light;
  const dotPx = Math.max(2, unit * 0.055);
  const fromScroll = scrollY;
  const toY = H * 0.38; // where it lands in the next section (it becomes the sea there)
  const t0 = performance.now();
  let raf = 0;
  let landed = false;
  let gone = false;

  const draw = (cx: number, cy: number, sx: number, sy: number, burst: number) => {
    ctx.clearRect(0, 0, W, H);
    if (dark) ctx.globalCompositeOperation = "lighter";
    const e = 1 - Math.pow(1 - burst, 3); // fast out, then slowing
    const fade = Math.pow(1 - burst, 1.4);
    const now = performance.now();
    for (const d of dots) {
      const depth = 1 + d.z * 0.06; // nearer dots a touch bigger, like the perspective in the story
      let x = cx + d.x * unit * sx * depth;
      let y = cy - d.y * unit * sy * depth;
      if (burst > 0) {
        // melts into the sea: flattens onto the surface and spreads along it, riding the waves
        x = cx + d.x * unit * depth * (1 + 3.2 * e) + d.vx * e * unit * 0.6;
        y = cy - d.y * unit * depth * (1 - 0.94 * e) + e * unit * 0.12 + Math.sin(x * 0.018 + now / 380) * 5 * e;
      }
      ctx.globalAlpha = (0.55 + 0.35 * d.s) * fade;
      ctx.fillStyle = d.a ? cA : cB;
      const s = dotPx * d.s * (1 - burst * 0.5) * 0.5; // round, like the story's points
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const step = (now: number) => {
    const t = now - t0;
    if (t < FALL) {
      const v = t / FALL;
      const ease = v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
      window.scrollTo({ top: fromScroll + (scrollTo - fromScroll) * ease, behavior: "instant" });
      // falls (on screen it moves only a little: the page is moving up past it), stretching as it goes
      const g = v * v;
      const stretch = Math.sin(Math.PI * Math.min(1, v * 1.05));
      draw(from.x, from.y + (toY - from.y) * g, 1 - 0.14 * stretch, 1 + 0.22 * stretch, 0);
    } else {
      if (!landed) {
        landed = true;
        window.scrollTo({ top: scrollTo, behavior: "instant" });
        onLand(from.x, toY);
      }
      const b = Math.min(1, (t - FALL) / MERGE);
      draw(from.x, toY, 1, 1, b);
      if (b >= 1) {
        stop();
        return;
      }
    }
    raf = requestAnimationFrame(step);
  };
  const stop = () => {
    if (gone) return;
    gone = true;
    cancelAnimationFrame(raf);
    canvas.remove();
  };
  raf = requestAnimationFrame(step);
  return stop;
}
