/*
 * Basic 3D models of AirGuard LT and CH for the products hero. There are no CAD files for these
 * two, so they're built procedurally from their product renders and kept deliberately simple:
 *   LT — a scoop-shaped guard: opaque top band with the AirGuard mark, clear front, a collar and
 *        a ribbed hose to the existing suction unit.
 *   CH — a clear visor under a white band, on a flexible gooseneck arm with a chair/furniture clamp.
 * Same studio lighting and materials as the XP scene; drag to turn, it turns slowly by itself;
 * no zoom or pan so page scrolling is never captured. Proportions are illustrative.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type BasicModelId = "lt" | "ch";

/** The named parts of each basic model (for the detail page's anatomy steps). */
export const basicParts: Record<BasicModelId, string[]> = { lt: ["shield", "band", "suction"], ch: ["shield", "band", "arm", "clamp"] };

export function mountBasicModel(
  stage: HTMLElement,
  {
    model,
    reducedMotion = false,
    theme = "light",
    getExplode,
    getFocus,
    getLabel,
    onSelect,
  }: {
    model: BasicModelId;
    reducedMotion?: boolean;
    /** "dark": brand-blue rim lights for a dark stage. */
    theme?: "light" | "dark";
    /** 0 assembled … 1 pulled apart; read every frame and eased. */
    getExplode?: () => number;
    /** A part kept highlighted. */
    getFocus?: () => string | null;
    /** The page's label element for a part; kept pinned beside it (same CSS variables as the XP scene). */
    getLabel?: (id: string) => HTMLElement | null;
    /** A click (not a drag) on a part. */
    onSelect?: (id: string) => void;
  }
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.touchAction = "pan-y";
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.setAttribute("aria-hidden", "true");
  stage.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.06).texture;
  room.dispose();
  pmrem.dispose();
  scene.environmentIntensity = 0.6;

  scene.add(new THREE.HemisphereLight(0xf7f8fa, 0xa1a8a5, 0.6));
  const key = new THREE.DirectionalLight(0xfffaf4, 1.7);
  key.position.set(3, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { near: 1, far: 30, left: -7, right: 7, top: 7, bottom: -7 });
  key.shadow.bias = -0.00015;
  key.shadow.normalBias = 0.012;
  scene.add(key);
  const rimLight = new THREE.DirectionalLight(0xeef3fa, 0.6);
  rimLight.position.set(-5, 3, -6);
  scene.add(rimLight);
  if (theme === "dark") {
    key.intensity = 1.35;
    const blueA = new THREE.DirectionalLight(0x5b8be0, 2.4);
    blueA.position.set(-6, 4, -7);
    const blueB = new THREE.DirectionalLight(0x4067b1, 1.8);
    blueB.position.set(6, 3, -6);
    scene.add(blueA, blueB);
    scene.environmentIntensity = 0.45;
  }

  // ── Materials (match the XP scene) ──
  const shell = new THREE.MeshPhysicalMaterial({ color: 0xeceeec, roughness: 0.45, clearcoat: 0.08, clearcoatRoughness: 0.5, envMapIntensity: 0.7, side: THREE.DoubleSide });
  const hoseMat = new THREE.MeshPhysicalMaterial({ color: 0xdfe2e2, roughness: 0.55, envMapIntensity: 0.6 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xf8faf9, transmission: 0.96, thickness: 0.05, roughness: 0.06, ior: 1.55, envMapIntensity: 1,
    transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false,
  });
  const edge = new THREE.MeshStandardMaterial({ color: 0xc9d2d6, roughness: 0.3, metalness: 0.2 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb9c3c9, roughness: 0.25, metalness: 0.85 });

  const root = new THREE.Group();
  scene.add(root);
  // Each named part is its own group, moved out along `offset` when the model is pulled apart.
  const groups = new Map<string, THREE.Group>();
  const offsets: Record<string, [number, number, number]> =
    model === "lt"
      ? { shield: [0, 0.2, 0.95], band: [0, 0.75, -0.1], suction: [0.2, 0.3, -1.2] }
      : { shield: [0, -0.35, 1.3], band: [0, 0.75, 0], arm: [0.3, 0.2, -0.7], clamp: [0.5, -0.9, -0.4] };
  for (const id of basicParts[model]) {
    const g = new THREE.Group();
    g.userData.partId = id;
    groups.set(id, g);
    root.add(g);
  }
  let current = basicParts[model][0];
  const add = <T extends THREE.Object3D>(o: T, cast = true) => {
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = cast;
        mesh.receiveShadow = true;
        // own material copy, so highlighting one part doesn't tint the others
        if (!Array.isArray(mesh.material)) mesh.material = mesh.material.clone();
      }
    });
    groups.get(current)!.add(o);
    return o;
  };
  const inPart = (id: string) => (current = id);

  /** Half an elliptical tube along z (an arch over the x axis), from z0 (back) to z1 (front). */
  function arch(rx: number, ry: number, z0: number, z1: number, mat: THREE.Material, flare = 1, theta = Math.PI) {
    const g = new THREE.CylinderGeometry(flare, 1, z1 - z0, 72, 1, true, Math.PI / 2 + (Math.PI - theta) / 2, theta);
    g.rotateX(Math.PI / 2); // cylinder axis y → z; θ range now spans the top half
    g.scale(rx, ry, 1);
    const m = new THREE.Mesh(g, mat);
    m.position.z = (z0 + z1) / 2;
    return m;
  }
  /** A thin rim tracing an arch's open edge, so clear plastic still reads. */
  function rim(rx: number, ry: number, z: number, theta = Math.PI) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (Math.PI - theta) / 2 + (i / 64) * theta;
      pts.push(new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * ry, z));
    }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.014, 8, false), edge);
  }
  function label(text: string, w: number, h: number) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#3f6fc4";
    ctx.font = "italic 700 78px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }
  /** A tube along a curve with raised rings at even steps: hoses and gooseneck arms. */
  function ribbed(points: THREE.Vector3[], r: number, rings: number, mat: THREE.Material, ringMat = mat) {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3(points);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, r, 24, false), mat));
    const torus = new THREE.TorusGeometry(r * 1.04, r * 0.16, 10, 32);
    for (let i = 1; i < rings; i++) {
      const t = i / rings;
      const ring = new THREE.Mesh(torus, ringMat);
      ring.position.copy(curve.getPointAt(t));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangentAt(t));
      g.add(ring);
    }
    return g;
  }

  if (model === "lt") {
    const RX = 1.55, RY = 1.0;
    // Opaque top band at the back, clear scoop in front.
    inPart("shield");
    add(arch(RX, RY, -0.15, 1.35, glass, 1.12), false);
    add(rim(RX * 1.12, RY * 1.12, 1.35));
    add(rim(RX, RY, -0.15));
    inPart("band");
    add(arch(RX, RY, -1.0, -0.15, shell));
    // Back wall: half disc with the collar opening.
    const capShape = new THREE.Shape();
    capShape.absellipse(0, 0, RX, RY, 0, Math.PI, false);
    capShape.lineTo(-RX, 0);
    const hole = new THREE.Path();
    hole.absarc(0, 0.45, 0.36, 0, Math.PI * 2, true);
    capShape.holes.push(hole);
    const cap = new THREE.Mesh(new THREE.ShapeGeometry(capShape, 48), shell);
    cap.position.z = -1.0;
    add(cap);
    const logo = label("AirGuard", 0.9, 0.22);
    logo.position.set(0, RY + 0.012, -0.55);
    add(logo, false);
    // Collar and ribbed hose to the suction unit.
    inPart("suction");
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.5, 48, 1, true), shell);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.45, -1.25);
    add(collar);
    add(
      ribbed(
        [new THREE.Vector3(0, 0.45, -1.4), new THREE.Vector3(0.05, 0.6, -1.95), new THREE.Vector3(0.35, 1.1, -2.35), new THREE.Vector3(0.85, 1.6, -2.5)],
        0.32,
        18,
        hoseMat
      )
    );
  } else {
    const RX = 1.7, RY = 0.85;
    // Clear visor sloping forward under a white band with the mark.
    inPart("shield");
    add(arch(RX, RY, -0.55, 1.25, glass, 1.18, Math.PI * 0.86), false);
    add(rim(RX * 1.18, RY * 1.18, 1.25, Math.PI * 0.86));
    inPart("band");
    add(arch(RX * 1.01, RY * 1.01, -0.6, -0.2, shell, 1.02, Math.PI * 0.9));
    const logo = label("AirGuard", 0.8, 0.2);
    logo.position.set(0, RY * 1.02 + 0.012, -0.4);
    add(logo, false);
    // Mount block on the band, then the 36" gooseneck down to the clamp.
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.3), shell);
    mount.position.set(0, RY + 0.06, -0.62);
    add(mount);
    const end = new THREE.Vector3(0.9, -2.35, -1.7);
    inPart("arm");
    add(
      ribbed(
        [new THREE.Vector3(0, RY + 0.1, -0.75), new THREE.Vector3(0, 1.15, -1.2), new THREE.Vector3(0.35, 0.7, -1.8), new THREE.Vector3(0.7, -0.6, -1.95), end],
        0.05,
        64,
        metal,
        edge
      )
    );
    // C-clamp: top jaw, spine, bottom jaw and a screw with its knob.
    inPart("clamp");
    const clamp = new THREE.Group();
    clamp.position.copy(end);
    const jaw = new THREE.BoxGeometry(0.42, 0.07, 0.34);
    const top = new THREE.Mesh(jaw, shell);
    top.position.y = -0.06;
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.34), shell);
    spine.position.set(-0.17, -0.33, 0);
    const bottom = new THREE.Mesh(jaw, shell);
    bottom.position.y = -0.6;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16), metal);
    screw.position.set(0.08, -0.5, 0);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 24), shell);
    knob.position.set(0.08, -0.76, 0);
    clamp.add(top, spine, bottom, screw, knob);
    add(clamp);
  }

  // Centre the model, sit it on a soft studio shadow, and frame it.
  const box = new THREE.Box3().setFromObject(root);
  const centre = box.getCenter(new THREE.Vector3());
  root.position.sub(new THREE.Vector3(centre.x, box.min.y, centre.z));
  const size = box.getSize(new THREE.Vector3());
  root.updateMatrixWorld(true);
  // Label anchor per part: the top-centre of its assembled bounds, in root space.
  const anchors = new Map<string, THREE.Vector3>();
  for (const [id, g] of groups) {
    const b = new THREE.Box3().setFromObject(g);
    anchors.set(id, new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2).sub(root.position));
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.16, color: 0x3b4a66, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);
  const radius = size.length() / 2;
  const target = new THREE.Vector3(0, size.y * 0.45, 0);
  const dist = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * (model === "ch" ? 0.92 : 0.82);
  camera.position.copy(target).add(new THREE.Vector3(0.62, 0.42, 0.66).normalize().multiplyScalar(dist));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.07;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.15;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.9;
  let resume = 0;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    window.clearTimeout(resume);
    renderer.domElement.style.cursor = "grabbing";
  });
  controls.addEventListener("end", () => {
    renderer.domElement.style.cursor = "grab";
    if (!reducedMotion) resume = window.setTimeout(() => (controls.autoRotate = true), 3000);
  });

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.zoom = Math.min(1, w / h / 1.25);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(stage);
  // Highlight: the focused part's surfaces glow faintly in brand blue.
  const TINT = new THREE.Color(0x4067b1);
  let tinted: string | null = null;
  const tint = (id: string | null) => {
    if (id === tinted) return;
    tinted = id;
    for (const [pid, g] of groups)
      g.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!mat || Array.isArray(mat) || !("emissive" in mat) || !mat.emissive) return;
        mat.emissive.copy(pid === id ? TINT : new THREE.Color(0));
        mat.emissiveIntensity = pid === id ? 0.25 : 1;
      });
  };

  // Click (not drag) on a part.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    if (!downAt || !onSelect) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    for (const hit of raycaster.intersectObjects([...groups.values()], true)) {
      let o: THREE.Object3D | null = hit.object;
      while (o && !o.userData.partId) o = o.parent;
      if (o) return onSelect(o.userData.partId as string);
    }
  };
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);

  const centre2 = new THREE.Vector3();
  const p = new THREE.Vector3();
  const placeLabels = () => {
    if (!getLabel) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    centre2.set(0, size.y * 0.45, 0).project(camera);
    const cx = (centre2.x * 0.5 + 0.5) * w, cy = (-centre2.y * 0.5 + 0.5) * h;
    let i = 0;
    for (const [id, g] of groups) {
      const el = getLabel(id);
      if (!el) continue;
      p.copy(anchors.get(id)!).add(root.position).add(g.position).project(camera);
      const ax = (p.x * 0.5 + 0.5) * w, ay = (-p.y * 0.5 + 0.5) * h;
      let dx = ax - cx, dy = ay - cy;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const L = i++ % 2 ? 92 : 64;
      el.style.setProperty("--ax", `${ax.toFixed(1)}px`);
      el.style.setProperty("--ay", `${ay.toFixed(1)}px`);
      el.style.setProperty("--ex", `${(ax + dx * L).toFixed(1)}px`);
      el.style.setProperty("--ey", `${(ay + dy * L).toFixed(1)}px`);
      el.style.setProperty("--len", `${L}px`);
      el.style.setProperty("--ang", `${Math.atan2(dy, dx).toFixed(4)}rad`);
      el.dataset.side = dx < 0 ? "left" : "right";
      el.dataset.hidden = "0";
      el.dataset.active = tinted === id ? "1" : "0";
    }
  };

  let raf = 0;
  let explode = 0;
  let last = performance.now();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;
    if (getExplode) {
      const t = Math.max(0, Math.min(1, getExplode()));
      explode = reducedMotion ? t : THREE.MathUtils.damp(explode, t, 7, dt);
      for (const [id, g] of groups) {
        const o = offsets[id];
        g.position.set(o[0] * explode, o[1] * explode, o[2] * explode);
      }
    }
    if (getFocus) tint(getFocus());
    controls.update();
    renderer.render(scene, camera);
    placeLabels();
  };
  loop();

  return () => {
    cancelAnimationFrame(raf);
    renderer.domElement.removeEventListener("pointerdown", onDown);
    renderer.domElement.removeEventListener("pointerup", onUp);
    window.clearTimeout(resume);
    ro.disconnect();
    io.disconnect();
    controls.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
      for (const mat of mats) {
        for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
        mat.dispose();
      }
    });
    scene.environment?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
