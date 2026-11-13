import { wheelGeometry } from "@/components/sections/hero-ring";

/*
 * The path the hero's ring follows as it uncoils into the Journey, shared by both sections so they
 * stay in step. In viewport px, as the screen is when the hero lets go (hero filling the screen):
 * the ring breaks at 9 o'clock; the strip runs straight down the left, takes a small curve just
 * above the hero's bottom edge so it crosses that edge onto the Journey's numbered rail, and
 * carries straight on down the rail. Distances are measured along the strip.
 */

/** How far the strip runs per screen of scroll (× the viewport height): slow and steady. */
export const UNCOIL_SPEED = 1.1;
/** Height of the curve just above the hero's bottom edge (px). */
const CURVE_H = 230;
/** The Journey's rail, marked with this attribute (family-story.tsx). */
export const RAIL_ATTR = "data-journey-rail";

export type PathPoint = { x: number; y: number; s: number; angle: number };

export function railX(fallback: number) {
  const rail = document.querySelector(`[${RAIL_ATTR}]`);
  if (!rail) return fallback;
  const r = rail.getBoundingClientRect();
  return r.left + r.width / 2;
}

/** The strip's path from the break, past the hero's bottom edge (y = vh) and on down the rail. */
export function uncoilPath(vw: number, vh: number, rail: number) {
  const g = wheelGeometry(vw, vh);
  const mid = (g.inner + g.outer) / 2;
  const bx = g.cx - mid;
  const curveTop = Math.max(g.cy + 40, vh - CURVE_H);
  const raw: { x: number; y: number }[] = [{ x: bx, y: g.cy }, { x: bx, y: curveTop }];
  // A gentle S: leave heading down, arrive heading down, over onto the rail's line at the edge.
  const h = vh - curveTop;
  for (let i = 1; i <= 40; i++) {
    const u = i / 40;
    const v = 1 - u;
    const c1 = { x: bx, y: curveTop + h * 0.55 };
    const c2 = { x: rail, y: vh - h * 0.55 };
    raw.push({
      x: v * v * v * bx + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * rail,
      y: v * v * v * curveTop + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * vh,
    });
  }
  raw.push({ x: rail, y: vh + 3 * vh });
  const points: PathPoint[] = [];
  let s = 0;
  raw.forEach((p, i) => {
    const q = raw[Math.min(i + 1, raw.length - 1)];
    const o = raw[Math.max(i - 1, 0)];
    if (i > 0) s += Math.hypot(p.x - raw[i - 1].x, p.y - raw[i - 1].y);
    points.push({ x: p.x, y: p.y, s, angle: (Math.atan2(q.y - o.y, q.x - o.x) * 180) / Math.PI });
  });
  /** Distance from the break to the hero's bottom edge. */
  const toEdge = points[points.length - 2].s;
  return { g, mid, points, toEdge };
}

export function pathAt(points: PathPoint[], s: number): PathPoint {
  if (s <= 0) return points[0];
  let lo = 0;
  let hi = points.length - 1;
  if (s >= points[hi].s) return points[hi];
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (points[m].s <= s) lo = m;
    else hi = m;
  }
  const p = points[lo];
  const q = points[hi];
  const t = (s - p.s) / (q.s - p.s || 1);
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, s, angle: p.angle + (q.angle - p.angle) * t };
}
