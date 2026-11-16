/**
 * The XP screen's intra-oral view, drawn in code: an upper dental arch seen from below (the
 * occlusal view a dentist works in), incisors at the top of the screen and molars at the sides,
 * with gingiva, palate and rugae, cheeks, wet highlights and tissue texture. The dental anatomy
 * (tooth order, relative widths and cusp patterns) follows a normal adult upper arch.
 *
 * Illustrative only: no clinical camera image. Drawn once into a canvas and reused, so it stays
 * sharp at every zoom level and needs no image licence.
 */

type Kind = "central" | "lateral" | "canine" | "premolar" | "molar";
/** Upper arch, midline outward: kind, mesio-distal width and bucco-lingual depth (mm). */
const TEETH: { kind: Kind; w: number; d: number }[] = [
  { kind: "central", w: 8.6, d: 7.0 },
  { kind: "lateral", w: 6.6, d: 6.2 },
  { kind: "canine", w: 7.6, d: 8.0 },
  { kind: "premolar", w: 7.0, d: 9.0 },
  { kind: "premolar", w: 6.7, d: 9.0 },
  { kind: "molar", w: 10.2, d: 11.0 },
  { kind: "molar", w: 9.4, d: 10.6 },
];
const GAP = 0.08;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawOcclusalArch(c: CanvasRenderingContext2D, W: number, H: number, seed = 7) {
  const rand = rng(seed);
  const u = W / 1024; // unit: one pixel at 1024 wide

  // ── The arch curve: x = cx + A sin θ, y = top + B (1 − cos θ). θ = 0 is the midline. ──
  const cx = W / 2;
  const top = H * 0.16;
  const A = W * 0.31;
  const B = H * 1.02;
  const at = (th: number) => ({ x: cx + A * Math.sin(th), y: top + B * (1 - Math.cos(th)) });
  const tangent = (th: number) => {
    const dx = A * Math.cos(th);
    const dy = B * Math.sin(th);
    const l = Math.hypot(dx, dy);
    return { x: dx / l, y: dy / l };
  };
  // arc-length table so teeth can be placed by width
  const N = 2000;
  const thMax = 1.32;
  const lens = [0];
  for (let i = 1; i <= N; i++) {
    const a = at(((i - 1) / N) * thMax);
    const b = at((i / N) * thMax);
    lens.push(lens[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const thAt = (len: number) => {
    let lo = 0;
    let hi = N;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (lens[m] < len) lo = m + 1;
      else hi = m;
    }
    return (lo / N) * thMax;
  };
  const totalMm = TEETH.reduce((s, t) => s + t.w + GAP, 0);
  const mm = (lens[N] * 0.95) / totalMm; // px per mm
  const lastTh = thAt((totalMm - 6) * mm); // the gum band (round-capped) ends at the last molar

  // ── Cheeks and lips (outside the arch): deep, wet mucosa darkening to the edges ──
  const bg = c.createRadialGradient(cx, H * 0.42, 40 * u, cx, H * 0.5, W * 0.62);
  bg.addColorStop(0, "#b8575a");
  bg.addColorStop(0.45, "#9a3c43");
  bg.addColorStop(0.8, "#5c1c24");
  bg.addColorStop(1, "#2a0a10");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // lips held back at the top edge (retracted upper lip)
  const lip = c.createLinearGradient(0, 0, 0, top * 0.9);
  lip.addColorStop(0, "#7d3036");
  lip.addColorStop(0.6, "#b5585c");
  lip.addColorStop(1, "rgba(181,88,92,0)");
  c.fillStyle = lip;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(W, 0);
  c.lineTo(W, top * 0.55);
  c.quadraticCurveTo(cx, top * 1.25, 0, top * 0.55);
  c.closePath();
  c.fill();

  // ── Palate inside the arch ──
  c.save();
  c.beginPath();
  for (let i = -100; i <= 100; i++) {
    const th = (i / 100) * thMax;
    const p = at(th);
    const t = tangent(th);
    // inward (palatal) normal is (−ty, tx)
    const inset = 4 * mm;
    const x = p.x - t.y * inset;
    const y = p.y + t.x * inset;
    if (i === -100) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  // carry the palate off the bottom of the screen toward the throat
  c.lineTo(at(thMax).x - 4 * mm, H + 10);
  c.lineTo(at(-thMax).x + 4 * mm, H + 10);
  c.closePath();
  const pal = c.createRadialGradient(cx, top + 30 * u, 10 * u, cx, H * 0.75, H * 0.85);
  pal.addColorStop(0, "#efaaa4");
  pal.addColorStop(0.35, "#dd8a86");
  pal.addColorStop(0.75, "#b9606a");
  pal.addColorStop(1, "#6e2a36");
  c.fillStyle = pal;
  c.fill();
  c.clip();
  // midline raphe
  c.strokeStyle = "rgba(255,226,220,.22)";
  c.lineWidth = 5 * u;
  c.filter = `blur(${2 * u}px)`;
  c.beginPath();
  c.moveTo(cx, top + 70 * u);
  c.bezierCurveTo(cx + 3 * u, H * 0.45, cx - 2 * u, H * 0.7, cx, H);
  c.stroke();
  c.filter = "none";
  // rugae: wavy transverse ridges behind the front teeth
  for (let k = 0; k < 5; k++) {
    const y = top + (80 + k * 34) * u;
    for (const side of [-1, 1]) {
      const len = (150 - k * 14) * u;
      c.beginPath();
      const j = (rand() - 0.5) * 14 * u;
      c.moveTo(cx + side * 10 * u, y + j);
      c.bezierCurveTo(cx + side * len * 0.35, y - (14 + rand() * 12) * u, cx + side * len * 0.7, y + (10 + rand() * 12) * u, cx + side * len, y - 6 * u + j);
      c.lineCap = "round";
      c.filter = `blur(${3 * u}px)`;
      c.strokeStyle = "rgba(120,40,48,.22)";
      c.lineWidth = 16 * u;
      c.stroke();
      c.strokeStyle = "rgba(255,214,206,.38)";
      c.lineWidth = 7 * u;
      c.stroke();
      c.filter = "none";
    }
  }
  // the back of the palate falls away into shadow
  const back = c.createLinearGradient(0, H * 0.55, 0, H);
  back.addColorStop(0, "rgba(60,10,20,0)");
  back.addColorStop(1, "rgba(60,10,20,.55)");
  c.fillStyle = back;
  c.fillRect(0, H * 0.55, W, H * 0.45);
  c.restore();

  // ── Gingiva: a band under the teeth along the arch ──
  const archPath = () => {
    c.beginPath();
    for (let i = -100; i <= 100; i++) {
      const p = at((i / 100) * lastTh);
      if (i === -100) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
  };
  c.lineCap = "round";
  c.lineJoin = "round";
  c.save();
  c.filter = `blur(${10 * u}px)`;
  archPath();
  c.strokeStyle = "rgba(150,52,62,.8)";
  c.lineWidth = 17 * mm;
  c.stroke();
  c.filter = `blur(${5 * u}px)`;
  archPath();
  c.strokeStyle = "#e7918f";
  c.lineWidth = 13.5 * mm;
  c.stroke();
  archPath();
  c.strokeStyle = "rgba(255,190,184,.5)";
  c.lineWidth = 11.8 * mm;
  c.stroke();
  c.restore();

  // ── Teeth ──
  type Placed = { x: number; y: number; ang: number; kind: Kind; w: number; d: number };
  const placed: Placed[] = [];
  for (const side of [-1, 1]) {
    let s = (GAP / 2) * mm;
    TEETH.forEach((t) => {
      const mid = s + (t.w * mm) / 2;
      const th = thAt(mid) * side;
      const p = at(th);
      const tg = tangent(th);
      placed.push({ x: p.x, y: p.y, ang: Math.atan2(tg.y, tg.x), kind: t.kind, w: t.w * mm, d: t.d * mm });
      s += (t.w + GAP) * mm;
    });
  }

  const outline = (k: Kind, w: number, d: number) => {
    // superellipse, flattened or pointed by kind; local x = along the arch, y = outward (+) / inward (−)
    const n = k === "molar" ? 3.4 : k === "premolar" ? 2.5 : k === "canine" ? 2.1 : 2.8;
    const pts: [number, number][] = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      let x = (Math.sign(ca) * Math.pow(Math.abs(ca), 2 / n) * w) / 2;
      let y = (Math.sign(sa) * Math.pow(Math.abs(sa), 2 / n) * d) / 2;
      if (k === "central" || k === "lateral") {
        // incisors: wide at the labial face, tapering to the cingulum
        const f = 0.62 + 0.38 * ((y / d) + 0.5);
        x *= f;
        y *= 0.95;
      }
      if (k === "canine" && sa < 0) x *= 1 - 0.25 * Math.abs(sa);
      pts.push([x, y]);
    }
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  };

  for (const t of placed) {
    c.save();
    c.translate(t.x, t.y);
    // local x runs along the arch, local +y points buccal (toward the cheek): (ty, −tx)
    const tx = Math.cos(t.ang);
    const ty = Math.sin(t.ang);
    c.transform(tx, ty, ty, -tx, 0, 0);

    // contact shadow on the gum
    c.save();
    c.shadowColor = "rgba(60,8,16,.7)";
    c.shadowBlur = 18 * u;
    c.shadowOffsetY = 5 * u;
    outline(t.kind, t.w * 1.02, t.d * 1.02);
    c.fillStyle = "#c9b494";
    c.fill();
    c.restore();

    // enamel body, lit from the operatory light above
    const tone = 0.96 + rand() * 0.05;
    const g = c.createRadialGradient(-t.w * 0.12, t.d * 0.12, t.d * 0.05, 0, 0, Math.max(t.w, t.d) * 0.62);
    const col = (r: number, gg: number, b: number) => `rgb(${Math.round(r * tone)},${Math.round(gg * tone)},${Math.round(b * tone)})`;
    g.addColorStop(0, col(255, 252, 242));
    g.addColorStop(0.45, col(244, 236, 216));
    g.addColorStop(0.85, col(214, 198, 166));
    g.addColorStop(1, col(176, 156, 122));
    outline(t.kind, t.w, t.d);
    c.fillStyle = g;
    c.fill();
    c.save();
    c.clip();

    // the enamel slopes away toward the edges
    outline(t.kind, t.w, t.d);
    c.strokeStyle = "rgba(150,124,86,.35)";
    c.lineWidth = Math.min(t.w, t.d) * 0.16;
    c.filter = `blur(${4 * u}px)`;
    c.stroke();
    c.filter = "none";
    // occlusal anatomy
    const groove = (path: () => void, wdt: number) => {
      c.save();
      c.lineCap = "round";
      c.lineJoin = "round";
      path();
      c.strokeStyle = "rgba(140,108,70,.42)";
      c.lineWidth = wdt;
      c.filter = `blur(${2.4 * u}px)`;
      c.stroke();
      c.filter = "none";
      path();
      c.strokeStyle = "rgba(100,74,46,.5)";
      c.lineWidth = wdt * 0.22;
      c.stroke();
      c.restore();
    };
    const cusp = (x: number, y: number, r: number) => {
      const cg = c.createRadialGradient(x - r * 0.2, y + r * 0.2, 0, x, y, r);
      cg.addColorStop(0, "rgba(255,255,250,.75)");
      cg.addColorStop(1, "rgba(255,255,250,0)");
      c.fillStyle = cg;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    };
    const w = t.w;
    const d = t.d;
    if (t.kind === "molar" || t.kind === "premolar") {
      // central fossa
      const fs = c.createRadialGradient(0, 0, 0, 0, 0, Math.min(w, d) * 0.4);
      fs.addColorStop(0, "rgba(150,118,76,.35)");
      fs.addColorStop(1, "rgba(150,118,76,0)");
      c.fillStyle = fs;
      c.fillRect(-w / 2, -d / 2, w, d);
    }
    if (t.kind === "molar") {
      cusp(-w * 0.22, d * 0.22, w * 0.26);
      cusp(w * 0.22, d * 0.22, w * 0.26);
      cusp(-w * 0.2, -d * 0.2, w * 0.24);
      cusp(w * 0.24, -d * 0.18, w * 0.22);
      groove(() => {
        c.beginPath();
        c.moveTo(-w * 0.38, d * 0.02);
        c.quadraticCurveTo(-w * 0.05, d * 0.08, w * 0.05, -d * 0.02);
        c.quadraticCurveTo(w * 0.2, -d * 0.06, w * 0.38, -d * 0.02);
        c.moveTo(-w * 0.02, d * 0.36);
        c.quadraticCurveTo(w * 0.06, d * 0.05, w * 0.02, -d * 0.36);
        c.moveTo(w * 0.05, -d * 0.02);
        c.lineTo(-w * 0.18, -d * 0.28);
      }, 5 * u);
    } else if (t.kind === "premolar") {
      cusp(0, d * 0.22, w * 0.34);
      cusp(0, -d * 0.2, w * 0.3);
      groove(() => {
        c.beginPath();
        c.moveTo(-w * 0.34, 0);
        c.quadraticCurveTo(0, d * 0.06, w * 0.34, 0);
      }, 4.5 * u);
    } else if (t.kind === "canine") {
      cusp(0, d * 0.12, w * 0.36);
      // the cusp ridge running front to back
      const rg = c.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
      rg.addColorStop(0, "rgba(255,255,250,0)");
      rg.addColorStop(0.5, "rgba(255,255,250,.5)");
      rg.addColorStop(1, "rgba(255,255,250,0)");
      c.fillStyle = rg;
      c.fillRect(-w * 0.5, -d * 0.04, w, d * 0.1);
    } else {
      // incisal edge and the lingual fossa behind it
      c.fillStyle = "rgba(255,255,252,.55)";
      c.beginPath();
      c.ellipse(0, d * 0.28, w * 0.4, d * 0.1, 0, 0, Math.PI * 2);
      c.fill();
      const fg = c.createRadialGradient(0, -d * 0.08, 0, 0, -d * 0.08, w * 0.3);
      fg.addColorStop(0, "rgba(150,120,82,.28)");
      fg.addColorStop(1, "rgba(150,120,82,0)");
      c.fillStyle = fg;
      c.beginPath();
      c.arc(0, -d * 0.08, w * 0.3, 0, Math.PI * 2);
      c.fill();
    }
    // a slight translucency at the edge facing the cheek
    const rim = c.createLinearGradient(0, d * 0.5, 0, d * 0.3);
    rim.addColorStop(0, "rgba(170,175,190,.35)");
    rim.addColorStop(1, "rgba(170,175,190,0)");
    c.fillStyle = rim;
    c.fillRect(-w, d * 0.3, w * 2, d * 0.3);
    c.restore();

    // wet glints
    c.fillStyle = "rgba(255,255,255,.9)";
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      c.ellipse((rand() - 0.5) * w * 0.4, (rand() - 0.2) * d * 0.4, w * (0.05 + rand() * 0.05), d * 0.025, rand() * Math.PI, 0, Math.PI * 2);
      c.fill();
    }
    // fine outline
    outline(t.kind, t.w, t.d);
    c.strokeStyle = "rgba(120,96,64,.3)";
    c.lineWidth = 1 * u;
    c.stroke();
    c.restore();
  }

  // ── Moist sheen on the soft tissue ──
  c.save();
  c.globalCompositeOperation = "screen";
  for (let k = 0; k < 14; k++) {
    const x = rand() * W;
    const y = rand() * H;
    const sg = c.createRadialGradient(x, y, 0, x, y, (20 + rand() * 50) * u);
    sg.addColorStop(0, "rgba(255,220,220,.18)");
    sg.addColorStop(1, "rgba(255,220,220,0)");
    c.fillStyle = sg;
    c.fillRect(x - 80 * u, y - 80 * u, 160 * u, 160 * u);
  }
  c.restore();

  // ── Tissue grain and the light falloff of a magnified view ──
  const img = c.getImageData(0, 0, W, H);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const n = (rand() - 0.5) * 14;
    px[i] += n;
    px[i + 1] += n * 0.8;
    px[i + 2] += n * 0.8;
  }
  c.putImageData(img, 0, 0);
  const vig = c.createRadialGradient(cx, H * 0.45, H * 0.35, cx, H * 0.5, W * 0.62);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(10,0,4,.6)");
  c.fillStyle = vig;
  c.fillRect(0, 0, W, H);
}
