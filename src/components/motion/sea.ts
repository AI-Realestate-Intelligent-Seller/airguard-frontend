/*
 * The sea seen from the shore, drawn by a small WebGL shader (no library) for DropReveal.
 * Each pixel below the sea's top edge (its horizon) casts a ray from a camera on the beach onto the water; the
 * surface there is a few long swells rolling towards the viewer plus finer chop, and it is lit the
 * way water is: it reflects the sky (more so towards the horizon), shows its own deep colour (lighter
 * through the wave crests), throws back a glitter path of sunlight (moonlight on dark pages) and
 * fades into haze far out.
 *
 * The water exists only below `edge` (foam along it) and within the half-ellipse it has spread to
 * from where the drop landed (`cx`, out `hw` to each side and `depth` down); elsewhere it is clear.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uHz, uCx, uHw, uDepth, uSunPow;
uniform vec3 uSkyTop, uSkyHz, uHaze, uDeep, uShallow, uSun, uFoam;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// height of the water at p (x across, y = distance out), with fine detail faded by distance
float sea(vec2 p, float t, float detail) {
  float h = 0.0;
  // long swells rolling in towards the shore, bent a little so the lines aren't straight
  h += 0.34 * sin(p.y * 0.42 + t * 1.05 + sin(p.x * 0.11 + t * 0.2) * 1.4);
  h += 0.20 * sin(dot(p, vec2(0.30, 0.55)) + t * 1.35);
  h += 0.14 * sin(dot(p, vec2(-0.42, 0.62)) * 1.2 + t * 1.6);
  // chop: noise octaves drifting with the wind
  float a = 0.11 * detail;
  vec2 q = p * vec2(1.1, 1.6);
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    h += a * (noise(q + vec2(t * 0.35, t * 0.8)) * 2.0 - 1.0);
    q = m * q;
    a *= 0.5;
  }
  return h;
}

vec3 sky(vec3 d) {
  float k = clamp(d.y * 2.2, 0.0, 1.0);
  vec3 c = mix(uSkyHz, uSkyTop, pow(k, 0.55));
  vec3 sunDir = normalize(vec3(0.0, 0.07, 1.0));
  float g = max(dot(d, sunDir), 0.0);
  return c + uSun * (pow(g, 90.0) * 0.35 + pow(g, 8.0) * 0.06);
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float yTop = 1.0 - fc.y / uRes.y; // 0 at the top of the canvas
  float xs = fc.x / uRes.x;
  // the sea's top edge (where the drop became water), with a moving, uneven line of foam
  float wob = (sin(fc.x * 0.011 + uTime * 3.3) * 0.6 + sin(fc.x * 0.029 - uTime * 4.7) * 0.4) * 0.008;
  float d = yTop - (uHz + wob);
  // how far the water has spread from where the drop landed: out to both sides and down
  float dx = (xs - uCx) / max(uHw, 0.0001);
  float dy = (yTop - uHz) / max(uDepth, 0.0001);
  float reach = dx * dx + dy * dy;
  if (d < 0.0 || reach > 1.0) { gl_FragColor = vec4(0.0); return; }

  float x = (xs - 0.5) * (uRes.x / uRes.y);
  float v = uHz - yTop; // < 0: below the sea's edge, which is its horizon
  vec3 dir = normalize(vec3(x, v - 0.002, 1.25));
  float camH = 1.7;
  float dist = camH / max(-dir.y, 0.0008);
  vec2 p = dir.xz * dist;
  float t = uTime;
  float detail = exp(-dist * 0.018);
  float e = 0.04 + dist * 0.004;
  float h = sea(p, t, detail);
  float hx = sea(p + vec2(e, 0.0), t, detail);
  float hz = sea(p + vec2(0.0, e), t, detail);
  float flatK = mix(0.25, 1.0, detail); // far water reads smoother
  vec3 n = normalize(vec3(-(hx - h) / e * flatK, 1.0, -(hz - h) / e * flatK));

  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, -dir), 0.0), 5.0);
  vec3 r = reflect(dir, n);
  r.y = abs(r.y);
  vec3 water = mix(uDeep, uShallow, clamp(h * 0.9 + 0.35, 0.0, 1.0) * 0.75);
  vec3 col = mix(water, sky(r) * 0.92, clamp(fres, 0.0, 0.85));
  vec3 sunDir = normalize(vec3(0.0, 0.07, 1.0));
  float s = max(dot(r, sunDir), 0.0);
  col += uSun * (pow(s, uSunPow) * 2.0 + pow(s, uSunPow * 0.12) * 0.05);
  col = mix(col, uHaze, 1.0 - exp(-dist * 0.016));

  // foam: along the top edge, and on the spreading front while the water is still reaching out
  float froth = noise(vec2(fc.x * 0.06, uTime * 6.0)) * 0.6 + noise(vec2(fc.x * 0.21 + fc.y * 0.1, uTime * 9.0)) * 0.4;
  float edgeFoam = smoothstep(0.022, 0.0, d) * (0.55 + 0.45 * froth);
  float frontFoam = smoothstep(0.82, 1.0, reach) * (0.5 + 0.5 * froth);
  col *= 1.0 - 0.18 * smoothstep(0.0, 0.022, d) * smoothstep(0.1, 0.022, d);
  col = mix(col, uFoam, max(edgeFoam, frontFoam * 0.85));
  float alpha = smoothstep(1.0, 0.94, reach);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

const THEMES = {
  light: { skyTop: "#eaf2fc", skyHz: "#d8e5f4", haze: "#d3e2f2", deep: "#0f3f78", shallow: "#3d8acb", sun: "#ffffff", foam: "#ffffff", sunPow: 420 },
  dark: { skyTop: "#04070d", skyHz: "#13223b", haze: "#132440", deep: "#010610", shallow: "#0c2c52", sun: "#a9c8ff", foam: "#d6e8ff", sunPow: 260 },
};

export type Sea = {
  resize: (w: number, h: number) => void;
  /** edge: the sea's top edge (0–1 from the top); cx, hw, depth: how far it has spread from the drop (fractions). */
  render: (o: { time: number; edge: number; cx: number; hw: number; depth: number }) => void;
  dispose: () => void;
};

export function mountSea(canvas: HTMLCanvasElement, dark: boolean): Sea | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl || gl.isContextLost()) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    if (process.env.NODE_ENV === "development") console.warn("sea shader:", gl.getProgramInfoLog(prog), gl.getShaderInfoLog(gl.getAttachedShaders(prog)![1]));
    return null;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const th = dark ? THEMES.dark : THEMES.light;
  for (const k of ["skyTop", "skyHz", "haze", "deep", "shallow", "sun", "foam"] as const) gl.uniform3fv(u(`u${k[0].toUpperCase()}${k.slice(1)}`), hex(th[k]));
  gl.uniform1f(u("uSunPow"), th.sunPow);
  const uRes = u("uRes"), uTime = u("uTime"), uHz = u("uHz"), uCx = u("uCx"), uHw = u("uHw"), uDepth = u("uDepth");

  return {
    resize(w, h) {
      // a little under device resolution: water has no hard edges, and it keeps phones smooth
      const scale = Math.min(devicePixelRatio, 1.5) * (w < 768 ? 0.75 : 1);
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    },
    render({ time, edge, cx, hw, depth }) {
      gl.uniform1f(uTime, time);
      gl.uniform1f(uHz, edge);
      gl.uniform1f(uCx, cx);
      gl.uniform1f(uHw, hw);
      gl.uniform1f(uDepth, depth);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      // free what this mount made, but keep the context: the same canvas is mounted again on a theme change
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}
