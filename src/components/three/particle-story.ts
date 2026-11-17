import * as THREE from "three";

/*
 * A scroll-told particle story: one field of particles that changes form chapter by chapter.
 * Every form is computed in the vertex shader from a per-particle seed and time, so the whole
 * story is a single draw call; `setChapter(2.4)` means 40% of the way from form 2 to form 3, and
 * each particle leaves a little earlier or later so a form dissolves rather than snaps.
 *
 * Particles belong to one of two groups (seed.w < SPLIT): oxygen / hydrogen in "genesis", leaf /
 * water in "infusion"; each chapter has a colour for each group.
 *
 * genesis   (before King Hydrogen)  atoms → water molecules → DNA double helix → a drop → it falls
 *                                   on into King Hydrogen, where it lands (DropReveal)
 * infusion  (before Arcane Herb)    a water surface along the top with leaves → a whirlpool →
 *                                   steeping amber → a six-petal bloom → a layer of tea
 */

export type StoryKind = "genesis" | "infusion";
const STAGES = 5;

const COMMON = /* glsl */ `
uniform float uTime, uChapter, uSize, uW, uH, uPx, uSplit;
uniform vec2 uPointer;
attribute vec4 aSeed;
varying float vGroup;
varying float vAlpha;
const float TAU = 6.2831853;
float hash(float n) { return fract(sin(n) * 43758.5453123); }
vec3 hash3(float n) { return vec3(hash(n), hash(n + 17.31), hash(n + 41.97)); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

`;

const GENESIS = /* glsl */ `
// 0 · atoms: loose clusters scattered through the space, drifting
vec3 f0(vec4 s, float t) {
  float id = floor(s.x * 46.0);
  vec3 c = (hash3(id) - 0.5) * vec3(uW * 1.05, uH * 1.05, 5.0);
  c.xy += vec2(sin(t * 0.2 + id), cos(t * 0.17 + id * 1.3)) * 0.35;
  // a round atom: points inside a small sphere
  vec3 dir = normalize(vec3(s.y, s.z, fract(s.x * 91.0)) - 0.5 + 1e-4);
  return c + dir * pow(fract(s.w * 7.7), 0.33) * 0.2;
}
// 1 · molecules: each cluster becomes H2O (one oxygen, two hydrogens at ~104.5°), drawing in
vec3 f1(vec4 s, float t) {
  float id = floor(s.x * 46.0);
  vec3 c = (hash3(id) - 0.5) * vec3(uW * 0.72, uH * 0.72, 3.0);
  vec2 atom = vec2(0.0);
  float size = 0.26;
  if (s.w >= uSplit) {                       // hydrogen: one of two arms
    float side = s.z < 0.5 ? -1.0 : 1.0;
    atom = vec2(sin(side * 0.912), -cos(0.912)) * 0.62;
    size = 0.15;
  }
  atom = rot(t * 0.35 + id) * atom;
  vec3 j = (vec3(s.y, s.z, fract(s.x * 37.0)) - 0.5) * size;
  return c + vec3(atom, 0.0) + j;
}
// 2 · DNA: a double helix across the screen, turning; the rest are its base-pair rungs
vec3 f2(vec4 s, float t) {
  float x = (s.x - 0.5) * uW * 0.92;
  float R = 1.35;
  float a = x * 1.15 + t * 0.7;
  if (s.y < 0.38) return vec3(x, cos(a) * R, sin(a) * R) + (hash3(s.x * 999.0) - 0.5) * 0.08;
  if (s.y < 0.76) return vec3(x, cos(a + 3.14159) * R, sin(a + 3.14159) * R) + (hash3(s.y * 999.0) - 0.5) * 0.08;
  float xs = floor(s.x * 26.0) / 26.0;           // rungs at regular steps
  float xr = (xs - 0.5) * uW * 0.92;
  float ar = xr * 1.15 + t * 0.7;
  vec3 A = vec3(xr, cos(ar) * R, sin(ar) * R);
  vec3 B = vec3(xr, cos(ar + 3.14159) * R, sin(ar + 3.14159) * R);
  return mix(A, B, s.z);
}
// 3 · a single water droplet, gently wobbling
vec3 f3(vec4 s, float t) {
  float u = s.x * TAU, v = acos(2.0 * s.y - 1.0);
  vec3 p = vec3(sin(v) * cos(u), cos(v), sin(v) * sin(u));
  float r = 1.25 * (0.82 + 0.18 * pow(s.z, 0.3));
  if (p.y > 0.0) { p.y *= 1.75; p.xz *= 1.0 - p.y / 2.2; }   // a teardrop: pointed on top
  p *= r;
  p.xz *= 1.0 + 0.04 * sin(t * 2.2 + p.y * 3.0);
  return p;
}
// 4 · the drop falls out of the bottom of the screen, on into King Hydrogen (where it lands)
vec3 f4(vec4 s, float t) {
  vec3 p = f3(s, t);
  p.y = p.y * 1.5 - uH * 0.95;
  p.xz *= 0.7;
  return p;
}
`;

const INFUSION = /* glsl */ `
// 0 · a layer of water along the top of the screen (carried on from King Hydrogen), leaves on it
vec3 f0(vec4 s, float t) {
  float x = (s.x - 0.5) * uW * 1.1;
  float surface = uH * 0.28 + sin(x * 1.0 + t * 1.8) * 0.13 + sin(x * 0.42 - t * 1.2) * 0.1;
  float depth = pow(s.z, 1.6) * (uH * 0.26);           // the water fills up to the top edge
  if (s.w < uSplit) depth *= 0.15;                     // leaves float on the surface
  return vec3(x, surface + depth, (s.y - 0.5) * 1.5);
}
// 1 · water and leaves swirl together into a whirlpool
vec3 f1(vec4 s, float t) {
  float r = 0.2 + pow(s.x, 0.7) * 3.4 + (s.w < uSplit ? 0.5 : 0.0);
  float a = s.y * TAU + t * (1.8 / (r + 0.35));
  return vec3(cos(a) * r, -0.3 + sin(a) * r * 0.38 + (s.z - 0.5) * 0.12, sin(a) * r * 0.3);
}
// 2 · steeping: the whirlpool deepens into a funnel and turns amber
vec3 f2(vec4 s, float t) {
  float r = 0.12 + pow(s.x, 0.85) * 2.9;
  float a = s.y * TAU + t * (2.6 / (r + 0.3));
  float y = -2.0 + r * 0.95;                       // the deeper the ring, the narrower
  return vec3(cos(a) * r, y + sin(a) * r * 0.3 + (s.z - 0.5) * 0.08, sin(a) * r * 0.3);
}
// 3 · it blooms: a six-petal flower (leaves form its heart)
vec3 f3(vec4 s, float t) {
  float th = s.y * TAU + t * 0.08;
  if (s.w < uSplit) {
    float rr = sqrt(s.x) * 0.55;
    return vec3(cos(th) * rr, sin(th) * rr, 0.1 + (s.z - 0.5) * 0.2);
  }
  float petal = pow(abs(cos(3.0 * th)), 0.7);
  float rho = 3.3 * petal * sqrt(s.x) + 0.35;
  float lift = sin(t * 0.9 + th * 3.0) * 0.06;
  return vec3(cos(th) * rho, sin(th) * rho + lift, (s.z - 0.5) * 0.4 - petal * 0.4);
}
// 4 · the swirl settles into a layer of tea across the bottom; Arcane Herb rises out of it
vec3 f4(vec4 s, float t) {
  float x = (s.x - 0.5) * uW * 1.1;
  float surface = -uH * 0.3 + sin(x * 0.9 + t * 1.6) * 0.13 + sin(x * 0.4 - t) * 0.09;
  float depth = pow(s.z, 1.6) * (uH * 0.25);
  if (s.w < uSplit) depth *= 0.25;                     // leaves float near the top
  return vec3(x, surface - depth, (s.y - 0.5) * 1.5);
}
`;

const MAIN = /* glsl */ `
vec3 form(int i, vec4 s, float t) {
  if (i <= 0) return f0(s, t);
  if (i == 1) return f1(s, t);
  if (i == 2) return f2(s, t);
  if (i == 3) return f3(s, t);
  return f4(s, t);
}
void main() {
  float c = clamp(uChapter, 0.0, 4.0);
  int i = int(floor(c));
  float k = smoothstep(0.0, 1.0, c - float(i));
  k = clamp((k - fract(aSeed.x * 13.7) * 0.25) / 0.75, 0.0, 1.0);
  vec3 p = mix(form(i, aSeed, uTime), form(min(i + 1, 4), aSeed, uTime), k);
  vec2 d = p.xy - uPointer;
  p.xy += normalize(d + 1e-4) * 0.7 * exp(-dot(d, d) * 1.2);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float big = aSeed.w < uSplit ? 1.25 : 1.0;
  gl_PointSize = uSize * uPx * big * (0.55 + fract(aSeed.y * 7.1)) / -mv.z;
  vGroup = aSeed.w < uSplit ? 1.0 : 0.0;
  vAlpha = 0.45 + 0.55 * fract(aSeed.z * 5.3);
}
`;

const FRAG = /* glsl */ `
uniform vec3 uA0, uA1, uB0, uB1;  // group A (split) / group B colours at the two chapters either side
uniform float uMix;
varying float vGroup;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  vec3 cA = mix(uA0, uA1, uMix), cB = mix(uB0, uB1, uMix);
  gl_FragColor = vec4(mix(cB, cA, vGroup), a * a * vAlpha);
}
`;

/** Per chapter: [group A colour, group B colour], for dark pages (glowing) and light pages (solid). */
const PALETTES: Record<StoryKind, Record<"dark" | "light", [string, string][]>> = {
  genesis: {
    dark: [
      ["#ff6f6f", "#dfe8ff"], // oxygen red, hydrogen white
      ["#ff6f6f", "#dfe8ff"],
      ["#b49cff", "#7fb6ff"], // the helix
      ["#bfe6ff", "#6fc3ff"], // water
      ["#bfe6ff", "#5aaeff"],
    ],
    light: [
      ["#df4a52", "#6f84ad"],
      ["#df4a52", "#6f84ad"],
      ["#6a50d6", "#2f6fe0"],
      ["#3d93ec", "#1f66cf"],
      ["#4b9cf0", "#1b5fc4"],
    ],
  },
  infusion: {
    dark: [
      ["#8fd19e", "#6fc3ff"], // leaves, water
      ["#8fd19e", "#5fb3d9"],
      ["#b8d48a", "#d9a25f"], // steeping amber
      ["#f2d27a", "#e8b86d"], // the bloom
      ["#e0b778", "#d39a52"], // tea
    ],
    light: [
      ["#3f9a5c", "#2b80df"],
      ["#3f9a5c", "#2f86b8"],
      ["#6c9f45", "#c27a2c"],
      ["#d29a28", "#c4782e"],
      ["#b8833a", "#a9672a"],
    ],
  },
};
const SPLIT: Record<StoryKind, number> = { genesis: 0.34, infusion: 0.35 };

export type Story = {
  setChapter: (c: number) => void;
  setPointer: (x: number | null, y: number | null) => void;
  dispose: () => void;
};

export function mountStory(canvas: HTMLCanvasElement, kind: StoryKind, { reduced = false, theme = "dark" as "dark" | "light" } = {}): Story {
  const small = innerWidth < 768;
  const count = small ? 2600 : 6500;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  const px = Math.min(devicePixelRatio, small ? 1.5 : 2);
  renderer.setPixelRatio(px);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 12;

  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

  const pal = PALETTES[kind][theme].map(([a, b]) => [new THREE.Color(a), new THREE.Color(b)] as const);
  const uniforms = {
    uTime: { value: 0 },
    uChapter: { value: 0 },
    uSize: { value: small ? 64 : 82 },
    uW: { value: 16 },
    uH: { value: 10 },
    uPx: { value: px },
    uSplit: { value: SPLIT[kind] },
    uPointer: { value: new THREE.Vector2(99, 99) },
    uA0: { value: pal[0][0].clone() },
    uA1: { value: pal[1][0].clone() },
    uB0: { value: pal[0][1].clone() },
    uB1: { value: pal[1][1].clone() },
    uMix: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: COMMON + (kind === "genesis" ? GENESIS : INFUSION) + MAIN,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    // glow on dark pages; on light pages additive light would vanish, so draw solid colour
    blending: theme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  scene.add(new THREE.Points(geo, mat));

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(22.5)) * camera.position.z;
    uniforms.uH.value = vh;
    uniforms.uW.value = vh * camera.aspect;
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let target = 0;
  let pointer: THREE.Vector2 | null = null;
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);

  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) uniforms.uTime.value += dt;
    const c = uniforms.uChapter.value;
    uniforms.uChapter.value = reduced ? target : c + (target - c) * Math.min(1, dt * 3);
    const ch = uniforms.uChapter.value;
    const i = Math.min(STAGES - 2, Math.floor(ch));
    uniforms.uA0.value.copy(pal[i][0]);
    uniforms.uB0.value.copy(pal[i][1]);
    uniforms.uA1.value.copy(pal[i + 1][0]);
    uniforms.uB1.value.copy(pal[i + 1][1]);
    uniforms.uMix.value = THREE.MathUtils.smoothstep(ch - i, 0, 1);
    const ptr = uniforms.uPointer.value;
    if (pointer) ptr.lerp(pointer, Math.min(1, dt * 8));
    else ptr.set(99, 99);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return {
    setChapter: (v) => (target = v),
    setPointer: (x, y) => {
      if (x === null || y === null) return (pointer = null);
      const r = canvas.getBoundingClientRect();
      pointer = new THREE.Vector2(((x - r.left) / r.width - 0.5) * uniforms.uW.value, -((y - r.top) / r.height - 0.5) * uniforms.uH.value);
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    },
  };
}
