/* eslint-disable prefer-const, @typescript-eslint/no-unused-vars -- the prototype's code is kept as written */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- untyped geometry ported verbatim from the prototype
// @ts-nocheck — the model is ported verbatim from the approved prototype
// ("images/site/king_hydrogen_aurora_3d_showcase_final.html"); plain three.js, kept as written.
/*
 * King Hydrogen Aurora, interactive 3D model without any control panel. Visitors drag to turn it
 * (it turns slowly by itself, pausing while they interact); hovering a part tints it softly and
 * its label lights up. Zoom with the + / − buttons or a pinch; a plain wheel still scrolls the page. Geometry, materials,
 * crest, etched glass, water and bubbles are the prototype's own, lit for a dark studio.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makeZoom } from "./zoom";

export function mountAurora(
  stage: HTMLElement,
  {
    getLabel,
    reducedMotion = false,
    onPick,
  }: {
    /** The page's label element for each part; the scene keeps it pinned to its part. */
    getLabel?: (id: string) => HTMLElement | null;
    reducedMotion?: boolean;
    /** A part was tapped or clicked (or tapped again to clear): its id, or null. */
    onPick?: (id: string | null) => void;
  } = {}
) {
const reduced = reducedMotion;
// The prototype was written for three r128 colour handling; build it the same way so its
// colours come out as designed, then restore the global setting.
const colorManagement = THREE.ColorManagement.enabled;
THREE.ColorManagement.enabled = false;
try {
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, stage.clientWidth / Math.max(1, stage.clientHeight), 0.1, 100);
camera.position.set(4.8, 3.45, 7.85); // close in: the Aurora fills the stage

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); // the section's own dark studio shows through
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.style.touchAction = "pan-y"; // vertical swipes still scroll the page on touch
renderer.domElement.setAttribute("aria-hidden", "true");
stage.appendChild(renderer.domElement);

function createPowderCoatBumpTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const v = 120 + Math.floor(Math.random() * 36);
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    return tex;
}

/**
 * High-DPI 1024x1536 silkscreen door artwork matching aurora_2.jpg & video:
 * Pure neutral matte charcoal-black base (#161616), crowned 'H' medallion,
 * spread-wing eagle over a 7-tier stepped stone monument, and "Don't Get Watered Down".
 */
let cabinetLogoLoaded=false;
function createDoorCrestTexture() {
    // Use the original supplied image, preserving its colors and aspect ratio.
    const canvas=document.createElement('canvas');
    canvas.width=1024;canvas.height=2312;
    const c=canvas.getContext('2d');
    c.fillStyle='#101010';c.fillRect(0,0,canvas.width,canvas.height);
    const tex=new THREE.CanvasTexture(canvas);
    tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
    const originalLogo=new Image();
    originalLogo.onload=()=>{
        const w=canvas.width*0.94,h=w*originalLogo.naturalHeight/originalLogo.naturalWidth;
        const x=(canvas.width-w)/2,y=(canvas.height-h)/2-80;
        c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
        c.drawImage(originalLogo,x,y,w,h);
        tex.needsUpdate=true;cabinetLogoLoaded=true;
    };
    originalLogo.onerror=()=>console.warn('Aurora: the cabinet artwork could not be loaded.');
    originalLogo.src='/images/site/king-hydrogen/aurora-cabinet-crest.webp';
    return tex;
}

/**
 * High-DPI 1024x512 recessed control faceplate texture:
 * Pure neutral matte charcoal base (#161616), hairline white border boxes,
 * M / Clock / S labels, Bluetooth® icon + text, and Start/Stop label.
 */
function createControlPanelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#161616';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Crisp neutral silver-white hairline border boxes
    ctx.strokeStyle = 'rgba(228, 228, 231, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 668, 464);
    ctx.strokeRect(712, 24, 288, 464);

    // M & S labels
    ctx.fillStyle = '#d4d4d8';
    ctx.font = '600 40px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M', 102, 134);
    ctx.fillText('S', 102, 396);

    // Clock / Timer icon in middle row
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(102, 256, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(102, 244);
    ctx.lineTo(102, 256);
    ctx.lineTo(111, 262);
    ctx.stroke();

    // Bluetooth® Emblem & Text
    const bx = 468;
    const by = 442;
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, by - 16);
    ctx.lineTo(bx, by + 16);
    ctx.lineTo(bx + 10, by + 8);
    ctx.lineTo(bx - 9, by - 8);
    ctx.moveTo(bx - 9, by + 8);
    ctx.lineTo(bx + 10, by - 8);
    ctx.lineTo(bx, by - 16);
    ctx.stroke();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 32px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Bluetooth®', bx + 20, by + 10);

    // Start/Stop label in right box
    ctx.fillStyle = '#d4d4d8';
    ctx.font = '500 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Start/Stop', 856, 276);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

/**
 * High-DPI 1024x1024 frosted white/ice-blue laser-etched classical chariot,
 * sun-rays, 5-arch aqueduct bridge, and olive tree artwork for the glass bottle front.
 */
function createGlassEtchingTexture() {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=960;
    const c=canvas.getContext('2d');c.scale(1.2,1.2);
    c.strokeStyle='rgba(174,207,255,0.96)';c.fillStyle='rgba(158,195,246,0.65)';
    c.lineWidth=3.0;c.lineJoin='round';c.lineCap='round';
    function path(d){c.stroke(new Path2D(d));}
    function circle(x,y,r){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();}
    // Tall sunburst and the robed charioteer, drawn as fine etched outlines.
    for(let i=0;i<34;i++){let a=i/34*Math.PI*2,r=75+(i%2)*16;c.beginPath();c.moveTo(204+Math.cos(a)*24,117+Math.sin(a)*24);c.lineTo(204+Math.cos(a)*r,117+Math.sin(a)*r);c.stroke();}
    path('M194 100 Q207 88 216 104 L216 125 L209 139 L218 150 L224 190 L244 219 L237 226 L214 207 L202 173 L184 219 L168 227 L164 216 L178 183 L183 150 L198 138 Z');
    path('M185 158 L177 278 L167 314 L217 321 L224 286 L207 190 M185 208 L193 274 L186 309 M201 221 L207 292 M193 150 L208 151 M202 142 L207 119');
    path('M214 158 L459 344 M222 170 L435 320 M166 223 L164 167 L156 165 L157 286');
    // Ornate chariot rail, seat and two spoked wheels.
    path('M161 277 L247 284 L238 355 L171 350 Z M167 287 L237 294 L229 343 L177 338 Z M156 268 L251 277 L249 286 L156 278 Z M171 350 L164 368 L259 375 L267 357 M236 306 L288 321 L293 344');
    for(const [x,y,r] of [[181,369,22],[250,376,20]]){circle(x,y,r);circle(x,y,r-5);for(let j=0;j<8;j++){let a=j/8*Math.PI*2;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*(r-4),y+Math.sin(a)*(r-4));c.stroke();}}
    // Two outlined horses, with mane, reins, bent legs and hooves.
    for(let h=0;h<2;h++){c.save();c.translate(h*59,h*-24);
        path('M271 315 L289 302 L324 310 L336 292 L340 274 L350 267 L348 252 L356 259 L365 249 L366 265 L382 274 L384 284 L374 292 L360 286 L352 319 L340 339 L337 370 L347 379 L346 386 L332 383 L326 370 L327 340 L311 337 L306 359 L298 380 L286 380 L286 373 L295 369 L296 337 L281 333 L275 350 L264 362 L254 361 M281 315 L268 302 L260 316 L259 332 M335 290 L347 278 L352 273 M360 277 L372 283 M329 316 L345 306');
        circle(367,273,1.8);path('M364 291 L275 290 L222 221');c.restore();}
    // Layered temple and architectural ledges.
    path('M93 391 L119 391 L119 359 L146 358 L146 385 L173 387 M111 380 L145 380 M101 402 L309 414 L313 429 L91 416 Z M79 427 L344 441 L345 455 L79 443 Z M78 446 L65 471 L361 489 L358 472 L82 456');
    for(let i=0;i<4;i++){let x=102+i*53,y=445+i*3;path(`M${x} ${y} L${x} ${y+28} L${x+15} ${y+29} L${x+15} ${y+1} M${x-3} ${y+29} L${x+19} ${y+30}`);}
    // Five arches with double outlines and narrow columns.
    path('M59 478 L372 499 L380 518 L53 495 Z M53 498 L53 589 L383 612 L380 520');
    for(let i=0;i<5;i++){let x=66+i*61,y=519+i*4;
        path(`M${x} ${y+68} L${x} ${y+22} Q${x+2} ${y-5} ${x+19} ${y-3} Q${x+37} ${y-2} ${x+38} ${y+25} L${x+38} ${y+70} M${x+6} ${y+67} L${x+6} ${y+24} Q${x+8} ${y+4} ${x+19} ${y+3} Q${x+31} ${y+4} ${x+32} ${y+26} L${x+32} ${y+69} M${x-5} ${y+70} L${x+42} ${y+73}`);}
    path('M50 579 Q28 574 33 596 Q13 613 35 628 Q35 651 61 647 Q80 666 102 653 Q122 674 144 660 Q166 682 186 667 Q210 689 231 673 Q255 695 276 681 Q299 699 320 685 Q346 707 364 691 Q395 703 405 684 Q426 682 415 658 Q420 635 397 633 L389 610');
    // Small olive tree with an irregular canopy and branching trunk.
    path('M479 652 L478 609 L463 597 M479 629 L494 611 M479 618 L475 588 M475 608 L452 584 M485 618 L511 597 M478 652 L463 659 L496 660 L485 652');
    path('M447 606 Q426 601 436 586 Q421 570 438 560 Q435 538 456 538 Q465 520 481 532 Q501 521 510 541 Q532 541 530 561 Q549 575 532 590 Q534 613 511 610 Q496 627 480 613 Q460 623 447 606 Z');
    for(let i=0;i<15;i++){let a=i*2.399,r=12+((i*17)%32);circle(482+Math.cos(a)*r,574+Math.sin(a)*r,5+(i%3));}
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex;
}

/**
 * High-intensity 14x14 SMD LED matrix array pad directly beneath the glass bottle base.
 */
function createLedPadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f296e';
    ctx.fillRect(0, 0, 512, 512);

    const cols = 14;
    const rows = 14;
    const margin = 28;
    const stepX = (512 - margin * 2) / (cols - 1);
    const stepY = (512 - margin * 2) / (rows - 1);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = margin + c * stepX;
            const y = margin + r * stepY;

            const grad = ctx.createRadialGradient(x, y, 2, x, y, 16);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.45, '#e0f2fe');
            grad.addColorStop(0.8, 'rgba(30, 136, 255, 0.55)');
            grad.addColorStop(1, 'rgba(15, 41, 110, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.fill();

            // Crisp white SMD LED emitter square
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 3.5, y - 3.5, 7, 7);
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

/**
 * 100% PURE NEUTRAL WHITE STUDIO ENVIRONMENT MAP (PMREM):
 * Zero blue panels! Only pure neutral white (#ffffff / #f4f6f8) softboxes
 * so the exterior powder-coated steel chassis has zero blue tint or reflection.
 */
function createNeutralStudioEnvironment(renderer, illuminatedGlass = false) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x181b21);

    // Overhead pure neutral white studio softbox
    const topSoftbox = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 7),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    topSoftbox.position.set(0, 12, 0);
    topSoftbox.rotation.x = Math.PI / 2;
    envScene.add(topSoftbox);

    // Front-right neutral white strip softbox (gives crisp reflections on glass & knob)
    const keySoftbox = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 13),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    keySoftbox.position.set(11, 5, 11);
    keySoftbox.lookAt(0, 0, 0);
    envScene.add(keySoftbox);

    // Left neutral white fill softbox (zero blue tint!)
    const leftSoftbox = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 10),
        new THREE.MeshBasicMaterial({ color: 0xf4f6f8, side: THREE.DoubleSide })
    );
    leftSoftbox.position.set(-12, 4, 4);
    leftSoftbox.lookAt(0, 0, 0);
    envScene.add(leftSoftbox);

    // Neutral studio floor bounce
    const floorBounce = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide })
    );
    floorBounce.position.set(0, -8, 0);
    floorBounce.rotation.x = -Math.PI / 2;
    envScene.add(floorBounce);

    if(illuminatedGlass){
        // Local blue overhead reflection captured only in the bottle environment.
        const blueBox=new THREE.Mesh(new THREE.PlaneGeometry(7,4),new THREE.MeshBasicMaterial({color:0x173cff,side:THREE.DoubleSide}));
        blueBox.position.set(0,5,0);blueBox.lookAt(0,0,0);envScene.add(blueBox);
        const strip=new THREE.Mesh(new THREE.PlaneGeometry(0.7,9),new THREE.MeshBasicMaterial({color:0x476bff,side:THREE.DoubleSide}));
        strip.position.set(-5,0,-3);strip.lookAt(0,0,0);envScene.add(strip);
    }
    const envRT = pmremGenerator.fromScene(envScene, 0.035);
    pmremGenerator.dispose();
    return envRT.texture;
}
// Subtle Contact Shadow Disc under the Dispenser Feet
function createContactShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.36)');
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.14)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
}

const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 3.4),
    new THREE.MeshBasicMaterial({
        map: createContactShadowTexture(),
        transparent: true,
        depthWrite: false
    })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0.002;
scene.add(shadowPlane);

function createRoundedBoxGeometry(width, height, depth, radius, smoothness = 3) {
    const shape = new THREE.Shape();
    const eps = 0.00001;
    const r = radius - eps;
    shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
    shape.absarc(eps, height - r * 2, eps, Math.PI, Math.PI / 2, true);
    shape.absarc(width - r * 2, height - r * 2, eps, Math.PI / 2, 0, true);
    shape.absarc(width - r * 2, eps, eps, 0, -Math.PI / 2, true);

    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: depth - radius * 2,
        bevelEnabled: true,
        bevelSegments: smoothness,
        steps: 1,
        bevelSize: r,
        bevelThickness: radius,
        curveSegments: smoothness
    });
    geo.center();
    return geo;
}

/**
 * Creates a square-shouldered apothecary/dispenser glass jar geometry with:
 * - Superellipse (squircle) cross-section with rounded vertical corners
 * - Thick glass base chamfer
 * - Smooth curved upper shoulder tapering into a wide cylindrical neck
 * - 3 distinct helical glass screw-threads and a thick rolled glass lip
 */
// Continuous manifold shell: outer wall, rolled mouth, inner wall and heavy base.
function createSquareGlassJarGeometry(width, bodyHeight, neckHeight) {
    const N=128, H=72, total=bodyHeight+neckHeight, half=width/2, neck=width*0.365;
    const vertices=[], indices=[];
    function radius(y, a) {
        const c=Math.cos(a), s=Math.sin(a);
        const square=half*Math.pow(Math.pow(Math.abs(c),4.3)+Math.pow(Math.abs(s),4.3),-1/4.3);
        let r=square;
        if(y<0.10) r*=0.90+0.10*Math.sin(y/0.10*Math.PI/2);
        if(y>bodyHeight-0.30){let t=Math.min(1,(y-bodyHeight+0.30)/0.30);t=t*t*(3-2*t);r=r*(1-t)+neck*t;}
        return r;
    }
    const rows=[];
    for(let j=0;j<=H;j++) rows.push([total*j/H,false]);
    for(let j=H;j>=0;j--) rows.push([0.055+(total-0.055)*j/H,true]);
    rows.forEach(([y,inner])=>{for(let i=0;i<=N;i++){const a=i/N*Math.PI*2;let r=radius(y,a)-(inner?0.018:0);vertices.push(Math.cos(a)*r,y-total/2,Math.sin(a)*r);}});
    for(let j=0;j<rows.length;j++){let k=(j+1)%rows.length;for(let i=0;i<N;i++){let a=j*(N+1)+i,b=k*(N+1)+i;indices.push(a,b,a+1,a+1,b,b+1);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

// ============================================================================
// 4. BUILD KING HYDROGEN AURORA 3D ASSEMBLY (ZERO BLUE ON EXTERIOR METAL)
// ============================================================================
const productRoot = new THREE.Group();
productRoot.name = 'King_Hydrogen_Aurora';
scene.add(productRoot);

// Exterior Powder-Coated Matte-Black Steel (#161616) — Neutral Black!
const bumpTex = createPowderCoatBumpTexture();
const exteriorSteelMat = new THREE.MeshPhysicalMaterial({
    reflectivity: 0.08, clearcoat: 0,
    color: 0x020202,
    roughness: 0.82,
    metalness: 0.05,
    envMapIntensity: 0.06,
    bumpMap: bumpTex,
    bumpScale: 0.0007
});

// Inner Dispenser Bay Wall Material (subtle dark satin finish that receives bay blue glow)
const innerBayWallMat = new THREE.MeshPhysicalMaterial({
    reflectivity: 0.08, clearcoat: 0,
    color: 0x020202,
    roughness: 0.82,
    metalness: 0.08,
    envMapIntensity: 0.06,
    bumpMap: bumpTex,
    bumpScale: 0.0006
});

const darkAnodizedMat = new THREE.MeshStandardMaterial({
    color: 0x080808,
    roughness: 0.4,
    metalness: 0.65
});

const polishedChromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.14,
    metalness: 0.95
});

const champagneChromeSpigotMat = new THREE.MeshStandardMaterial({
    color: 0x654019,
    roughness: 0.34,
    metalness: 0.75,
    envMapIntensity: 0.50
});

// Dimensions matching reference photo & turntable video
const W = 2.40;
const D = 1.66;
const lowerH = 1.96;
const upperH = 0.88;

// --- A. Base Plinth & Rubber Feet ---
const baseGroup = new THREE.Group();
baseGroup.name = 'Chassis_Base';
productRoot.add(baseGroup);

const basePlate = new THREE.Mesh(
    createRoundedBoxGeometry(W, 0.12, D, 0.014, 2),
    exteriorSteelMat
);
basePlate.position.set(0, 0.12, 0);
basePlate.castShadow = true;
basePlate.receiveShadow = true;
basePlate.name = 'Base_Plinth';
baseGroup.add(basePlate);

const footGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.07, 24);
[
    [-W / 2 + 0.24, 0.035, -D / 2 + 0.24],
    [ W / 2 - 0.24, 0.035, -D / 2 + 0.24],
    [-W / 2 + 0.24, 0.035,  D / 2 - 0.24],
    [ W / 2 - 0.24, 0.035,  D / 2 - 0.24]
].forEach((pos, idx) => {
    const foot = new THREE.Mesh(footGeo, darkAnodizedMat);
    foot.position.set(...pos);
    foot.castShadow = true;
    foot.name = `Rubber_Foot_${idx + 1}`;
    baseGroup.add(foot);
});

// --- B. Lower Split Body: Left Electrolysis Cabinet + Right Open Dispenser Bay ---
const lowerBodyGroup = new THREE.Group();
lowerBodyGroup.name = 'Lower_Cabinet_And_Bay';
productRoot.add(lowerBodyGroup);

const lowerY = 0.18 + lowerH / 2;
const leftCabW = 0.88;
const leftCabX = -W / 2 + leftCabW / 2;

// Left Cabinet Housing (Neutral Matte Black Exterior)
const leftCabinetBox = new THREE.Mesh(
    createRoundedBoxGeometry(leftCabW, lowerH, D - 0.04, 0.012, 2),
    exteriorSteelMat
);
leftCabinetBox.position.set(leftCabX, lowerY, -0.02);
leftCabinetBox.castShadow = true;
leftCabinetBox.receiveShadow = true;
leftCabinetBox.name = 'Left_Electrolysis_Cabinet';
lowerBodyGroup.add(leftCabinetBox);

// Recessed Rectangular Flush Pull Handle on Left Side Wall (seen in turntable video!)
const sideHandleGroup = new THREE.Group();
sideHandleGroup.position.set(-W / 2 - 0.002, lowerY + 0.42, -0.04);
sideHandleGroup.name = 'Left_Side_Flush_Handle';
lowerBodyGroup.add(sideHandleGroup);

const sideHandleBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.16, 0.34),
    darkAnodizedMat
);
sideHandleGroup.add(sideHandleBezel);

const sideHandleRecess = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.09, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x08090b, roughness: 0.7 })
);
sideHandleGroup.add(sideHandleRecess);

// Illustrative Internal Cell — not verified engineering (visible when cabinet opens)
const internalPemGroup = new THREE.Group();
internalPemGroup.position.set(leftCabX, lowerY, 0.08);
internalPemGroup.name = 'Illustrative_Internal_Core';
lowerBodyGroup.add(internalPemGroup);

const pemCellCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 1.18, 28),
    polishedChromeMat
);
pemCellCylinder.position.set(0, -0.08, 0);
internalPemGroup.add(pemCellCylinder);

const pemTopManifold = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.27, 0.14, 28),
    darkAnodizedMat
);
pemTopManifold.position.set(0, 0.54, 0);
internalPemGroup.add(pemTopManifold);

// Hinged Left Front Cabinet Door with Crowned 'H' Crest
const doorPivotGroup = new THREE.Group();
doorPivotGroup.position.set(-W / 2 + 0.015, lowerY, D / 2);
doorPivotGroup.name = 'Left_Cabinet_Door_Pivot';
lowerBodyGroup.add(doorPivotGroup);

const doorCrestTex = createDoorCrestTexture();
// Preserve the supplied artwork colors without exposure washing them out.
const doorFrontMat = new THREE.MeshBasicMaterial({map:doorCrestTex,toneMapped:false});

const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(leftCabW - 0.025, lowerH - 0.03, 0.038),
    [exteriorSteelMat, exteriorSteelMat, exteriorSteelMat, exteriorSteelMat, doorFrontMat, exteriorSteelMat]
);
doorMesh.position.set((leftCabW - 0.025) / 2, 0, 0);
doorMesh.castShadow = true;
doorMesh.name = 'Left_Cabinet_Door_Mesh';
doorPivotGroup.add(doorMesh);

// Recessed Finger-Pull Latch on Right Edge of Front Door
const latchFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.21, 0.044), darkAnodizedMat);
latchFrame.position.set(leftCabW - 0.15, 0.06, 0.003);
latchFrame.name = 'Door_Recessed_Latch';
doorPivotGroup.add(latchFrame);

// Open Right Dispenser Bay Walls (Inner surfaces catch confined royal-blue glow)
const bayW = W - leftCabW;
const bayCenterX = -W / 2 + leftCabW + bayW / 2;

// Inner Left Divider Panel (faces the glass bottle)
const bayInnerDivider = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, lowerH, D - 0.06),
    innerBayWallMat
);
bayInnerDivider.position.set(-W / 2 + leftCabW + 0.005, lowerY, -0.02);
bayInnerDivider.name = 'Dispenser_Bay_Inner_Left_Wall';
lowerBodyGroup.add(bayInnerDivider);

// Bay Back Wall (Inner side glows deep royal blue, outer back stays neutral matte black)
const bayBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(bayW, lowerH, 0.045),
    [innerBayWallMat, innerBayWallMat, innerBayWallMat, innerBayWallMat, innerBayWallMat, exteriorSteelMat]
);
bayBackWall.position.set(bayCenterX, lowerY, -D / 2 + 0.0225);
bayBackWall.receiveShadow = true;
bayBackWall.name = 'Dispenser_Bay_Back_Wall';
lowerBodyGroup.add(bayBackWall);

// Recessed rear right panel: the front half of the bottle bay stays open.
const rightPanelFrontZ = -0.04;
const rightPanelBackZ = -D / 2 + 0.02;
const rightPanelDepth = rightPanelFrontZ - rightPanelBackZ;
const bayRightWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, lowerH, rightPanelDepth),
    [exteriorSteelMat, innerBayWallMat, exteriorSteelMat, exteriorSteelMat, exteriorSteelMat, exteriorSteelMat]
);
bayRightWall.position.set(W / 2 - 0.0225, lowerY, (rightPanelFrontZ + rightPanelBackZ) / 2);
bayRightWall.castShadow = true;
bayRightWall.receiveShadow = true;
bayRightWall.name = 'Dispenser_Bay_Recessed_Right_Rear_Panel';
lowerBodyGroup.add(bayRightWall);

// Bay Ceiling Underside (catches upward blue light from the jar)
const bayCeilingPanel = new THREE.Mesh(
    new THREE.BoxGeometry(bayW - 0.04, 0.02, D - 0.12),
    innerBayWallMat
);
bayCeilingPanel.position.set(bayCenterX, 0.18 + lowerH + 0.005, -0.02);
bayCeilingPanel.name = 'Dispenser_Bay_Ceiling';
lowerBodyGroup.add(bayCeilingPanel);

// Interior Silver Mounting Screws on Inner Divider Wall
const screwMetal=new THREE.MeshStandardMaterial({color:0x777b80,metalness:0.85,roughness:0.29,envMapIntensity:0.65});
const screwSlotMat=new THREE.MeshBasicMaterial({color:0x101214});
function makePhillipsScrew(){
    const g=new THREE.Group();
    const washer=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.004,32),screwMetal);washer.position.y=-0.007;g.add(washer);
    const head=new THREE.Mesh(new THREE.CylinderGeometry(0.020,0.023,0.014,32),screwMetal);g.add(head);
    for(let i=0;i<2;i++){
        const slot=new THREE.Mesh(new THREE.BoxGeometry(0.026,0.0008,0.0045),screwSlotMat);
        slot.position.y=0.0072;slot.rotation.y=i*Math.PI/2+0.2;g.add(slot);
    }
    return g;
}
const screwGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.018, 16);
[
    [-W / 2 + leftCabW + 0.016, lowerY + 0.65, D / 2 - 0.16],
    [-W / 2 + leftCabW + 0.016, lowerY - 0.42, D / 2 - 0.16]
].forEach((pos, idx) => {
    const s = makePhillipsScrew();
    s.rotation.z = -Math.PI / 2;
    s.position.set(...pos);
    s.name = `Bay_Interior_Screw_${idx + 1}`;
    lowerBodyGroup.add(s);
});

// --- C. Upper Control & Exhaust Fan Head (100% Neutral Charcoal Black) ---
const upperGroup = new THREE.Group();
upperGroup.name = 'Upper_Control_And_Fan_Head';
productRoot.add(upperGroup);

const upperY = 0.18 + lowerH + upperH / 2 + 0.015;

const upperMainBox = new THREE.Mesh(
    createRoundedBoxGeometry(W, upperH, D, 0.014, 2),
    exteriorSteelMat
);
upperMainBox.position.set(0, upperY, 0);
upperMainBox.castShadow = true;
upperMainBox.receiveShadow = true;
upperMainBox.name = 'Upper_Housing_Main';
upperGroup.add(upperMainBox);

// Overhanging Beveled Top Lid Cap
const topLid = new THREE.Mesh(
    createRoundedBoxGeometry(W + 0.045, 0.095, D + 0.045, 0.012, 2),
    exteriorSteelMat
);
topLid.position.set(0, upperY + upperH / 2 + 0.04, 0);
topLid.castShadow = true;
topLid.name = 'Top_Lid_Cap';
upperGroup.add(topLid);

// Exterior Corner Screws (Right Lid & Lower Corner)
[
    [W / 2 + 0.022, upperY + upperH / 2 + 0.04,  D / 2 - 0.12],
    [W / 2 + 0.022, upperY + upperH / 2 + 0.04, -D / 2 + 0.12],
    [W / 2 + 0.002, 0.34, rightPanelFrontZ - 0.08]
].forEach((sc, i) => {
    const screw = makePhillipsScrew();
    screw.rotation.z = -Math.PI / 2;
    screw.position.set(...sc);
    screw.name = `Exterior_Screw_${i + 1}`;
    upperGroup.add(screw);
});

// Top Circular 6-Ring Chrome Wire Exhaust Fan Assembly
const fanGroup = new THREE.Group();
fanGroup.position.set(0, upperY + upperH / 2 + 0.088, 0);
fanGroup.name = 'Top_Exhaust_Fan_Assembly';
upperGroup.add(fanGroup);

const fanWell = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.012, 44), darkAnodizedMat);
fanGroup.add(fanWell);

// 6 Concentric Chrome Grille Rings + 4 Radial Spokes
[0.10, 0.175, 0.25, 0.325, 0.40, 0.475].forEach((r, idx) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.007, 12, 80), screwMetal);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.032;
    ring.name = `Fan_Grille_Ring_${idx + 1}`;
    fanGroup.add(ring);
});

for (let s = 0; s < 4; s++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.04, 10), screwMetal);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = (s / 4) * Math.PI;
    spoke.position.y = 0.038;
    fanGroup.add(spoke);
}

for(let i=0;i<4;i++){
    const a=Math.PI/4+i*Math.PI/2;
    const bolt=makePhillipsScrew();bolt.position.set(Math.cos(a)*0.56,0.022,Math.sin(a)*0.56);bolt.name='Fixed_Grille_Mount_'+i;fanGroup.add(bolt);
    const tab=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.012,0.045),screwMetal);tab.position.set(Math.cos(a)*0.51,0.012,Math.sin(a)*0.51);tab.rotation.y=-a;fanGroup.add(tab);
}

// Upper-Left Front 13 Vertical Slotted Cooling Louvers
const ventGroup = new THREE.Group();
ventGroup.position.set(-W / 2 + leftCabW / 2, upperY, D / 2 + 0.002);
ventGroup.name = 'Front_Ventilation_Louvers';
upperGroup.add(ventGroup);

const ventShape=new THREE.Shape();ventShape.moveTo(-0.43,-0.38);ventShape.lineTo(0.43,-0.38);ventShape.lineTo(0.43,0.38);ventShape.lineTo(-0.43,0.38);ventShape.closePath();
for(let v=0;v<13;v++){const x=-0.36+v*0.06,r=0.012,h=new THREE.Path();h.moveTo(x-r,-0.22);h.lineTo(x-r,0.24);h.absarc(x,0.24,r,Math.PI,0,true);h.lineTo(x+r,-0.22);h.absarc(x,-0.22,r,0,-Math.PI,true);ventShape.holes.push(h);}
const ventSheet=new THREE.Mesh(new THREE.ExtrudeGeometry(ventShape,{depth:0.012,bevelEnabled:false,curveSegments:8}),exteriorSteelMat);ventSheet.position.z=0.018;ventGroup.add(ventSheet);
const ventDark=new THREE.Mesh(new THREE.PlaneGeometry(0.85,0.75),new THREE.MeshStandardMaterial({color:0x020303,roughness:1}));ventDark.position.z=0.002;ventGroup.add(ventDark);

// Upper-Right Recessed Control Panel
const ctrlPanelGroup = new THREE.Group();
ctrlPanelGroup.position.set(bayCenterX - 0.02, upperY - 0.01, D / 2 + 0.008);
ctrlPanelGroup.name = 'Control_Panel_Assembly';
upperGroup.add(ctrlPanelGroup);

const ctrlFace = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.7, 0.024),
    new THREE.MeshStandardMaterial({
        map: createControlPanelTexture(),
        roughness: 0.36,
        metalness: 0.25
    })
);
ctrlFace.name = 'Control_Panel_Faceplate';
ctrlPanelGroup.add(ctrlFace);

// Knurled Matte-Black Rotary Control Knob with Silver Rim & Indicator Line
const knobCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.158, 0.12, 48),
    darkAnodizedMat
);
knobCylinder.rotation.x = Math.PI / 2;
knobCylinder.position.set(-0.11, -0.02, 0.065);
knobCylinder.material=new THREE.MeshPhysicalMaterial({color:0x010101,metalness:0,roughness:0.55,reflectivity:0.05,envMapIntensity:0.03,clearcoat:0});
knobCylinder.castShadow = true;
knobCylinder.name = 'Rotary_Control_Dial';
ctrlPanelGroup.add(knobCylinder);

const knobChromeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.142, 0.0045, 12, 64),
    polishedChromeMat
);
knobChromeRing.position.set(-0.11, -0.02, 0.123);
ctrlPanelGroup.add(knobChromeRing);

const knobTick = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.065, 0.008), polishedChromeMat);
knobTick.position.set(-0.14, -0.07, 0.126);
knobTick.rotation.z = 0.55;
ctrlPanelGroup.add(knobTick);

// 3 Glowing Blue Indicator Buttons (M, Timer, S)
// Un-tonemapped indicator lenses retain their saturated reference colors.
const blueLedMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#0789ed').convertSRGBToLinear(), toneMapped:false
});

[0.17, 0.0, -0.17].forEach((ly, idx) => {
    const ledBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.032, 24), blueLedMat);
    ledBtn.rotation.x = Math.PI / 2;
    ledBtn.position.set(-0.42, ly, 0.018);
    ledBtn.name = `Status_LED_${idx + 1}`;
    ctrlPanelGroup.add(ledBtn);
});

// Glowing Green Power Symbol Button
const greenPowerMat = new THREE.MeshBasicMaterial({
    color:new THREE.Color('#43f4a0').convertSRGBToLinear(),toneMapped:false
});

const powerBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.036, 28), polishedChromeMat);
powerBezel.rotation.x = Math.PI / 2;
powerBezel.position.set(0.48, 0.16, 0.018);
ctrlPanelGroup.add(powerBezel);

const powerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.042, 48), new THREE.MeshStandardMaterial({color:0x04150b,roughness:0.44,metalness:0.1,envMapIntensity:0.15}));
powerCore.rotation.x = Math.PI / 2;
powerCore.position.set(0.48, 0.16, 0.02);
powerCore.name = 'Green_Power_Button_LED';
ctrlPanelGroup.add(powerCore);
const powerRing=new THREE.Mesh(new THREE.TorusGeometry(0.045,0.004,10,64),greenPowerMat);powerRing.position.set(0.48,0.16,0.043);ctrlPanelGroup.add(powerRing);
const powerSymbol=new THREE.Mesh(new THREE.TorusGeometry(0.023,0.0032,8,48,Math.PI*1.6),greenPowerMat);powerSymbol.rotation.z=Math.PI*0.7;powerSymbol.position.set(0.48,0.16,0.045);ctrlPanelGroup.add(powerSymbol);
const powerStem=new THREE.Mesh(new THREE.BoxGeometry(0.005,0.027,0.002),greenPowerMat);powerStem.position.set(0.48,0.181,0.046);ctrlPanelGroup.add(powerStem);


const brushedCanvas=document.createElement('canvas');brushedCanvas.width=256;brushedCanvas.height=256;
const bc=brushedCanvas.getContext('2d');bc.fillStyle='#555b61';bc.fillRect(0,0,256,256);
for(let i=0;i<720;i++){const a=i/720*Math.PI*2,v=Math.round(85+70*Math.pow(Math.sin(a*2+0.7),2));bc.strokeStyle=`rgb(${v},${v+4},${v+7})`;bc.lineWidth=1.2;bc.beginPath();bc.moveTo(128,128);bc.lineTo(128+181*Math.cos(a),128+181*Math.sin(a));bc.stroke();}
const brushedTex=new THREE.CanvasTexture(brushedCanvas);brushedTex.colorSpace=THREE.SRGBColorSpace;
const brushedButtonMat=new THREE.MeshStandardMaterial({map:brushedTex,color:0xb0b0b0,metalness:0.65,roughness:0.42,envMapIntensity:0.45});

// Brushed Stainless-Steel Start/Stop Push Button
const startStopBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.068, 0.036, 28), polishedChromeMat);
startStopBezel.rotation.x = Math.PI / 2;
startStopBezel.position.set(0.48, -0.17, 0.018);
ctrlPanelGroup.add(startStopBezel);

const startStopCore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.044, 48), [screwMetal,brushedButtonMat,brushedButtonMat]);
startStopCore.rotation.x = Math.PI / 2;
startStopCore.position.set(0.48, -0.17, 0.021);
startStopCore.name = 'Start_Stop_Button';
ctrlPanelGroup.add(startStopCore);

// --- D. HIGH-DETAIL GLASS BOTTLE CENTERPIECE & CONFINED BAY BLUE ILLUMINATION ---
const dispenserGroup = new THREE.Group();
dispenserGroup.position.set(bayCenterX, 0.18, 0.04);
dispenserGroup.name = 'Glass_Bottle_Dispenser_Assembly';
productRoot.add(dispenserGroup);

// One concealed source above the mouth; no lamp or luminous pad below the jar.
const overheadUVLight = new THREE.SpotLight(0x3444ff, 4.2, 2.6, 0.52, 1.0, 1.5);
overheadUVLight.position.set(0,1.88,0);
overheadUVLight.target.position.set(0,0.18,0);
overheadUVLight.castShadow=false;
overheadUVLight.shadow.mapSize.set(1024,1024);
overheadUVLight.shadow.bias=-0.001;
dispenserGroup.add(overheadUVLight,overheadUVLight.target);

// 3. Thick Refractive Clear Glass Bottle (Square-Shouldered + Helical Screw Neck)
const jarW = 1.14;
const jarBodyH = 1.38;
const jarNeckH = 0.25;

const illuminatedGlassEnv = createNeutralStudioEnvironment(renderer, true);
// Alpha-blended glass is intentional for this r128 viewer: the old transmission
// path sampled the bright studio environment instead of showing the bay and water.
const clearGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc2d9ff, transmission: 0, envMap: illuminatedGlassEnv,
    roughness: 0.11, metalness: 0.0,
    envMapIntensity: 0.15, clearcoat: 0.05, clearcoatRoughness: 0.025,
    transparent: true, opacity: 0.12, depthWrite: false,
    side: THREE.FrontSide
});

const glassJarGeo = createSquareGlassJarGeometry(jarW, jarBodyH, jarNeckH);
const glassJarMesh = new THREE.Mesh(glassJarGeo, clearGlassMat);
glassJarMesh.position.set(0, 0.045 + (jarBodyH + jarNeckH) / 2, 0);
glassJarMesh.name = 'Square_Shouldered_Glass_Bottle';
glassJarMesh.renderOrder=5;
dispenserGroup.add(glassJarMesh);
const heavyGlassBase=new THREE.Mesh(createRoundedBoxGeometry(jarW*0.94,0.055,jarW*0.94,0.024,8),clearGlassMat);
heavyGlassBase.position.y=0.073;heavyGlassBase.renderOrder=4;heavyGlassBase.name='Heavy_Molded_Glass_Base';dispenserGroup.add(heavyGlassBase);



// 4. Almost colorless transparent water; blue comes from the concealed overhead lighting.
const waterH = 1.28;
const hydrogenWaterMat = new THREE.MeshBasicMaterial({
    color:0xffffff, vertexColors:true, transparent:true, opacity:0.075,
    depthWrite:false, toneMapped:false
});
// Rounded square water volume with a flat surface, independent of bottle shoulders.
// Match the inside of the glass, including the narrowing shoulder at the fill line.
const waterGeo = new THREE.CylinderGeometry(1,1,waterH,128,48,false);
const waterPos=waterGeo.attributes.position;
for(let i=0;i<waterPos.count;i++){
    const x=waterPos.getX(i),z=waterPos.getZ(i),a=Math.atan2(z,x),r0=Math.hypot(x,z);
    const y=waterPos.getY(i)+waterH/2+0.03;
    let r=(jarW/2-0.024)*Math.pow(Math.pow(Math.abs(Math.cos(a)),4.3)+Math.pow(Math.abs(Math.sin(a)),4.3),-1/4.3);
    if(y<0.10)r*=0.90+0.10*Math.sin(y/0.10*Math.PI/2);
    if(y>jarBodyH-0.30){let t=Math.min(1,(y-jarBodyH+0.30)/0.30);t=t*t*(3-2*t);r=r*(1-t)+(jarW*0.365-0.024)*t;}
    waterPos.setX(i,Math.cos(a)*r*r0);waterPos.setZ(i,Math.sin(a)*r*r0);
}
const waterColors=[];
const waterLow=new THREE.Color('#3f68ff').convertSRGBToLinear();
const waterHigh=new THREE.Color('#182132').convertSRGBToLinear();
for(let i=0;i<waterPos.count;i++){
    const t=(waterPos.getY(i)+waterH/2)/waterH;
    const x=waterPos.getX(i),z=waterPos.getZ(i);
    // Localized returned blue light: strong near the heel and left wall,
    // weak through the upper central water instead of a uniform tint.
    const heelReturn=Math.exp(-Math.pow(t/0.20,2));
    const leftReturn=Math.exp(-Math.pow((x+0.48)/0.20,2)-Math.pow((t-0.25)/0.32,2));
    const frontFalloff=0.70+0.30*Math.exp(-Math.pow((z-0.28)/0.45,2));
    const weight=Math.min(1,(heelReturn*0.85+leftReturn*0.55)*frontFalloff);
    const c=waterHigh.clone().lerp(waterLow,weight);waterColors.push(c.r,c.g,c.b);
}
waterGeo.setAttribute('color',new THREE.Float32BufferAttribute(waterColors,3));
waterGeo.computeVertexNormals();
const waterMesh = new THREE.Mesh(waterGeo, hydrogenWaterMat);
waterMesh.position.set(0,0.075+waterH/2,0);
waterMesh.renderOrder=2;waterMesh.name='Clear_Water_Volume';dispenserGroup.add(waterMesh);
// Visible waterline matching the exact shoulder cross-section, not a square plate.
const surfaceVertices=[0,0,0],surfaceIndices=[],waterline=[];
for(let i=0;i<=128;i++){
    // CylinderGeometry's first row is the top perimeter, already fitted to the bottle.
    const x=waterPos.getX(i),z=waterPos.getZ(i);
    surfaceVertices.push(x,0,z);waterline.push(new THREE.Vector3(x,0,z));
    if(i<128)surfaceIndices.push(0,i+2,i+1);
}
const surfaceGeo=new THREE.BufferGeometry();surfaceGeo.setAttribute('position',new THREE.Float32BufferAttribute(surfaceVertices,3));surfaceGeo.setIndex(surfaceIndices);surfaceGeo.computeVertexNormals();
const meniscusMat=new THREE.MeshBasicMaterial({color:new THREE.Color('#4269d9').convertSRGBToLinear(),
    transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});
const meniscusMesh=new THREE.Mesh(surfaceGeo,meniscusMat);
meniscusMesh.position.y=0.075+waterH+0.002;meniscusMesh.renderOrder=3;
meniscusMesh.name='Visible_Water_Fill_Surface';dispenserGroup.add(meniscusMesh);
const waterlineMesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(waterline),128,0.003,6,false),meniscusMat);
waterlineMesh.position.y=meniscusMesh.position.y;waterlineMesh.renderOrder=4;waterlineMesh.name='Water_Meniscus_Edge';dispenserGroup.add(waterlineMesh);
// True helical thread and rolled opening, separate from the hollow vessel shell.
const threadPoints=[];
for(let i=0;i<=480;i++){const t=i/480,a=t*Math.PI*6;threadPoints.push(new THREE.Vector3(Math.cos(a)*(jarW*0.365+0.008),0.045+jarBodyH+0.035+t*0.15,Math.sin(a)*(jarW*0.365+0.008)));}
const thread=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(threadPoints),480,0.012,8,false),clearGlassMat);
thread.renderOrder=5;thread.name='Continuous_Glass_Screw_Thread';dispenserGroup.add(thread);
const lip=new THREE.Mesh(new THREE.TorusGeometry(jarW*0.365-0.008,0.014,12,128),clearGlassMat);
lip.rotation.x=Math.PI/2;lip.position.y=0.045+jarBodyH+jarNeckH;lip.renderOrder=5;lip.name='Rolled_Open_Glass_Rim';dispenserGroup.add(lip);

// 5. Multi-Size Effervescent Hydrogen Micro-Bubbles & Rising Clusters
const bubbleCount = 150;
const bubbleGeo = new THREE.SphereGeometry(0.0045, 10, 10);
const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xdceaff, roughness:0.06, metalness:0.25, envMap:illuminatedGlassEnv, envMapIntensity:1.5,
    transparent: true, depthWrite:false,
    opacity: 0.55
});
const bubbles = [];
const bubblesGroup = new THREE.Group();
bubblesGroup.name = 'Effervescent_Hydrogen_Bubbles';
dispenserGroup.add(bubblesGroup);

for (let b = 0; b < bubbleCount; b++) {
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
    // Varied micro-bubble and cluster bubble sizes
    const scale = b % 7 === 0 ? 1.35 + Math.random() * 0.55 : 0.45 + Math.random() * 0.75;
    bubble.scale.set(scale, scale, scale);
    bubble.position.set(
        (Math.random() - 0.5) * 0.57,
        0.12 + Math.random() * 1.12,
        (Math.random() - 0.5) * 0.57
    );
    bubble.renderOrder=3;
    bubblesGroup.add(bubble);
    bubbles.push({
        mesh: bubble,
        speed: 0.0009 + Math.random() * 0.0028,
        wobbleOffset: Math.random() * Math.PI * 2
    });
}

// 6. Frosted White/Ice-Blue Etched Classical Chariot & 5-Arch Aqueduct Artwork
const etchingPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.61, 0.7625),
    new THREE.MeshBasicMaterial({
        map: createGlassEtchingTexture(),
        transparent: true,
        opacity: 0.92,
        toneMapped: false,
        depthWrite: false
    })
);
// Front is +Z, the same face as the valve. Keep the artwork centered
// above the valve with a slight right offset, without wrapping onto the left side.
etchingPlane.position.set(0.01, 0.90, jarW / 2 + 0.010);
etchingPlane.rotation.set(0, 0, 0);
etchingPlane.material.side=THREE.FrontSide;
etchingPlane.material.depthTest=true;
etchingPlane.renderOrder=6;
etchingPlane.name = 'Jar_Front_Logo_Above_Valve';
dispenserGroup.add(etchingPlane);

// Molded heel bead follows the rounded-square bottle footprint.
const heelPoints=[];
for(let i=0;i<=192;i++){const a=i/192*Math.PI*2,r=jarW*0.47*Math.pow(Math.pow(Math.abs(Math.cos(a)),4.3)+Math.pow(Math.abs(Math.sin(a)),4.3),-1/4.3);heelPoints.push(new THREE.Vector3(Math.cos(a)*r,0.092,Math.sin(a)*r));}
const heel=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(heelPoints),192,0.012,10,false),clearGlassMat);heel.name='Molded_Glass_Heel_Bead';dispenserGroup.add(heel);

const rimBlueMat=new THREE.MeshBasicMaterial({color:new THREE.Color('#2557f2').convertSRGBToLinear(),transparent:true,opacity:0.12,depthWrite:false,toneMapped:false});
lip.material=rimBlueMat;heel.material=rimBlueMat;heel.renderOrder=5;
const threadBlueMat=rimBlueMat.clone();threadBlueMat.opacity=0.07;thread.material=threadBlueMat;
const baseBlueMat=rimBlueMat.clone();baseBlueMat.opacity=0.06;heavyGlassBase.material=baseBlueMat;

// Soft reflected-light patches, not additional emitters. These approximate
// the return from the thick glass heel and the inner black divider.
function makeReturnLightTexture(){
    const cv=document.createElement('canvas');cv.width=512;cv.height=512;
    const ctx=cv.getContext('2d');
    function pool(x,y,rx,ry,strength){
        ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
        const grad=ctx.createRadialGradient(0,0,0,0,0,1);
        grad.addColorStop(0,`rgba(95,138,255,${strength})`);
        grad.addColorStop(.20,`rgba(35,75,255,${strength*.82})`);
        grad.addColorStop(.55,`rgba(15,40,235,${strength*.30})`);
        grad.addColorStop(1,'rgba(10,25,160,0)');
        ctx.fillStyle=grad;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    pool(190,290,200,160,.72);pool(320,220,150,190,.35);
    const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;return tx;
}
const returnTexture=makeReturnLightTexture();
const bottomReturnMat=new THREE.MeshBasicMaterial({map:returnTexture,transparent:true,
    opacity:0.72,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
const bottomReturn=new THREE.Mesh(new THREE.PlaneGeometry(1.04,1.04),bottomReturnMat);
bottomReturn.rotation.x=-Math.PI/2;bottomReturn.position.set(-0.025,0.105,0.015);
bottomReturn.renderOrder=1;bottomReturn.name='Soft_Reflected_Blue_On_Glass_Heel';dispenserGroup.add(bottomReturn);
const leftReturnMat=bottomReturnMat.clone();leftReturnMat.opacity=0.48;
const leftReturn=new THREE.Mesh(new THREE.PlaneGeometry(1.10,0.94),leftReturnMat);
leftReturn.rotation.y=Math.PI/2;
leftReturn.position.set(-bayW/2+0.025,0.50,0.03);leftReturn.renderOrder=1;
leftReturn.name='Soft_Reflected_Blue_On_Black_Left_Divider';dispenserGroup.add(leftReturn);

// 7. Precision Multi-Part Polished Chrome/Nickel-Plated Brass Spigot
const spigotGroup = new THREE.Group();
spigotGroup.position.set(-0.08, 0.34, jarW / 2);
spigotGroup.name = 'Chrome_Brass_Dispensing_Spigot';
dispenserGroup.add(spigotGroup);

// Silicone Gasket Washer against Glass
const siliconeWasher = new THREE.Mesh(
    new THREE.CylinderGeometry(0.086, 0.09, 0.045, 28),
    new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.32,
        transparent: true,
        opacity: 0.88
    })
);
siliconeWasher.rotation.x = Math.PI / 2;
siliconeWasher.position.z = 0.022;
siliconeWasher.name = 'Spigot_Silicone_Washer';
spigotGroup.add(siliconeWasher);

// Hexagonal Locknut Collar
const hexLocknut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.036, 6),
    champagneChromeSpigotMat
);
hexLocknut.rotation.x = Math.PI / 2;
hexLocknut.position.z = 0.058;
hexLocknut.name = 'Spigot_Hex_Locknut';
spigotGroup.add(hexLocknut);

// Cylindrical Valve Body Barrel
const tapBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.056, 0.24, 28),
    champagneChromeSpigotMat
);
tapBarrel.rotation.x = Math.PI / 2;
tapBarrel.position.z = 0.165;
tapBarrel.castShadow = true;
tapBarrel.name = 'Spigot_Valve_Body';
spigotGroup.add(tapBarrel);

// Curved Downward Pour Spout + Aerated Nozzle Tip
const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0.23),
    new THREE.Vector3(0, -0.045, 0.28),
    new THREE.Vector3(0, -0.145, 0.30)
]);
const tapSpout = new THREE.Mesh(
    new THREE.TubeGeometry(spoutCurve, 20, 0.042, 24, false),
    champagneChromeSpigotMat
);
tapSpout.castShadow = true;
tapSpout.name = 'Spigot_Curved_Spout';
spigotGroup.add(tapSpout);

const nozzleTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.038, 0.032, 24),
    champagneChromeSpigotMat
);
nozzleTip.position.set(0, -0.155, 0.302);
nozzleTip.name = 'Spigot_Aerated_Nozzle';
spigotGroup.add(nozzleTip);

// Valve Bonnet & Interactive Top Lever Handle Pivot
const valveBonnet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.09, 24),
    champagneChromeSpigotMat
);
valveBonnet.position.set(0, 0.068, 0.185);
spigotGroup.add(valveBonnet);

const leverPivotGroup = new THREE.Group();
leverPivotGroup.position.set(0, 0.118, 0.185);
leverPivotGroup.rotation.y = 0.22;
leverPivotGroup.name = 'Spigot_Lever_Pivot';
spigotGroup.add(leverPivotGroup);

const leverHandle = new THREE.Mesh(
    createRoundedBoxGeometry(0.24, 0.022, 0.044, 0.006, 2),
    champagneChromeSpigotMat
);
leverHandle.position.set(0.075, 0, 0);
leverHandle.castShadow = true;
leverHandle.name = 'Spigot_Lever_Handle';
leverPivotGroup.add(leverHandle);

// Machined dial flutes, inset screw drives and rubber panel seams.
for(let i=0;i<48;i++){const a=i/48*Math.PI*2;const flute=new THREE.Mesh(new THREE.BoxGeometry(0.006,0.012,0.085),darkAnodizedMat);flute.position.set(-0.11+0.149*Math.cos(a),-0.02+0.149*Math.sin(a),0.071);flute.rotation.z=a;ctrlPanelGroup.add(flute);}
productRoot.traverse(o=>{if(o.isMesh){o.receiveShadow=!o.material.transparent;if(!o.material.transmission&&!o.material.transparent)o.castShadow=true;}});
// Make cabinet opening functional without an opaque solid box hiding the interior.
leftCabinetBox.visible=false;
[[0.025,lowerH,D-0.04,-W/2+0.012,lowerY,-0.02],
 [leftCabW,lowerH,0.025,leftCabX,lowerY,-D/2+0.018]].forEach(v=>{
    const panel=new THREE.Mesh(new THREE.BoxGeometry(v[0],v[1],v[2]),exteriorSteelMat);panel.position.set(v[3],v[4],v[5]);panel.castShadow=true;lowerBodyGroup.add(panel);
});
// A fine dark bore inside the spout reads as an opening, not a solid cap.
const bore=new THREE.Mesh(new THREE.CircleGeometry(0.028,32),new THREE.MeshBasicMaterial({color:0x080808,side:THREE.DoubleSide}));bore.rotation.x=Math.PI/2;bore.position.set(0,-0.172,0.302);spigotGroup.add(bore);

const neutralEnvMap = createNeutralStudioEnvironment(renderer);
scene.environment = neutralEnvMap;

const controls = new OrbitControls(camera, renderer.domElement);
renderer.domElement.style.touchAction = "pan-y"; // OrbitControls sets "none"; vertical swipes must still scroll the page
controls.enableDamping = !reduced;
controls.dampingFactor = 0.06;
controls.enableZoom = false; // never captures the page's scroll
controls.enablePan = false;
controls.minPolarAngle = Math.PI * 0.26;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 1.55, 0);
controls.autoRotate = !reduced;
controls.autoRotateSpeed = 0.75;

// The prototype's studio lights (r128 intensities; × π for today's physical light units).
const L = Math.PI;
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x777777, 0.26 * L);
scene.add(hemiLight);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.15 * L);
keyLight.position.set(5.5, 9.5, 6.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 25;
keyLight.shadow.camera.left = -4; keyLight.shadow.camera.right = 4; keyLight.shadow.camera.top = 5; keyLight.shadow.camera.bottom = -2;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);
const leftFillLight = new THREE.DirectionalLight(0xf4f6f8, 0.28 * L);
leftFillLight.position.set(-6.5, 4.5, 4.0);
scene.add(leftFillLight);
const rimLight = new THREE.DirectionalLight(0xffffff, 0.62 * L);
rimLight.position.set(-4.5, 6.5, -6.5);
scene.add(rimLight);


// Today's spot lights use physical units: the concealed blue light over the jar, at the prototype's strength.
overheadUVLight.intensity = 4.2 * L * 1.7;
bubblesGroup.visible = true;

// ── Parts: every labelled part, by the prototype's own groups. ──
const partGroups = {
  jar: dispenserGroup,
  spigot: spigotGroup,
  dial: ctrlPanelGroup,
  vents: ventGroup,
  fan: fanGroup,
  door: doorPivotGroup,
  handle: sideHandleGroup,
};
const buttonMeshes = [powerBezel, powerCore, powerRing, powerSymbol, powerStem, startStopBezel, startStopCore];
const selectable = [];
for (const [id, g] of Object.entries(partGroups)) {
  g.traverse(o => {
    if (!o.isMesh || o.userData.partId) return;
    if (bubblesGroup.children.includes(o)) return;
    o.userData.partId = id;
  });
}
spigotGroup.traverse(o => { if (o.isMesh) o.userData.partId = "spigot"; });
buttonMeshes.forEach(m => { m.userData.partId = "buttons"; });
productRoot.traverse(o => {
  if (!o.isMesh || bubblesGroup.children.includes(o) || o === etchingPlane) return;
  selectable.push(o);
  // Each labelled part gets its own materials, so its hover tint stays on that part alone.
  if (o.userData.partId) o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
});
const mats = m => (Array.isArray(m.material) ? m.material : [m.material]);

// Studio contact shadow, a touch stronger on the dark backdrop.
shadowPlane.material.opacity = 0.9;

// ── Hover: the part under the pointer glows faintly; its label lights up. ──
const HOVER_TINT = new THREE.Color(0x2f6bff);
let hoveredId = null;
let pinnedId = null; // tapped (phones) or clicked part, kept lit until tapped again
function setHovered(id){
  id = id ?? pinnedId;
  if (id === hoveredId) return;
  hoveredId = id;
  for (const m of selectable) {
    if (!m.userData.partId) continue;
    const on = id && m.userData.partId === id;
    for (const mat of mats(m)) {
      if (!mat.emissive) continue;
      mat.emissive.copy(on ? HOVER_TINT : new THREE.Color(0));
      mat.emissiveIntensity = on ? 0.35 : 1;
    }
  }
  renderer.domElement.style.cursor = id ? "pointer" : "grab";
}
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
let dragging = false, lastPointer = null;
function pickAt(clientX, clientY){
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(selectable, false)[0];
  return hit ? hit.object.userData.partId || null : null;
}
function report(clientX, clientY){ setHovered(dragging ? null : pickAt(clientX, clientY)); }
const onMove = e => { lastPointer = { x: e.clientX, y: e.clientY }; report(e.clientX, e.clientY); };
const onLeave = () => { lastPointer = null; setHovered(null); };
renderer.domElement.addEventListener("pointermove", onMove);
renderer.domElement.addEventListener("pointerleave", onLeave);
renderer.domElement.style.cursor = "grab";

// Tap (or click) a part to keep it lit and its name shown; tap it again to clear.
let downAt = null;
const onDown = e => { downAt = { x: e.clientX, y: e.clientY }; };
const onUp = e => {
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return;
  downAt = null;
  const id = pickAt(e.clientX, e.clientY);
  pinnedId = id && id !== pinnedId ? id : null;
  hoveredId = undefined; setHovered(e.pointerType === "mouse" ? id : null);
  onPick?.(pinnedId);
};
renderer.domElement.addEventListener("pointerdown", onDown);
renderer.domElement.addEventListener("pointerup", onUp);

// Auto-turn pauses while the visitor interacts, and picks up again a few seconds later.
let resumeTimer = 0;
controls.addEventListener("start", () => { dragging = true; controls.autoRotate = false; window.clearTimeout(resumeTimer); setHovered(null); });
controls.addEventListener("end", () => {
  dragging = false;
  if (!reduced) resumeTimer = window.setTimeout(() => { if (!hoveredId) controls.autoRotate = true; }, 3000);
});

// Zoom: the page's + / − buttons, or a pinch; a plain wheel still scrolls the page.
const zoom = makeZoom(camera, controls, renderer.domElement, { reduced });

// Size to the stage.
const resize = () => {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h;
  camera.zoom = Math.min(1, (w / h) / (w < 560 ? 0.92 : 1.1)); // phones: numbered dots, so the model can be larger
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
};
const sizeObserver = new ResizeObserver(resize);
sizeObserver.observe(stage);
resize();

// ── Labels: every part has one, pinned to a point on it (model space). ──
const anchors = {
  jar: [0.82, 1.45, 0.58],
  spigot: [0.36, 0.6, 0.86],
  dial: [0.31, 2.56, 0.93],
  buttons: [0.9, 2.42, 0.9],
  vents: [-0.76, 2.78, 0.86],
  fan: [0.32, 3.17, 0.3],
  door: [-0.77, 1.66, 0.87],
  handle: [-1.22, 1.58, -0.04],
};
const ORDER = ["jar", "spigot", "dial", "buttons", "vents", "fan", "door", "handle"];
const LEADER = [64, 92];
const LEADER_NARROW = [26, 40]; // phones: short lines, so the names stay on screen
const pillWidths = new WeakMap(); // px, alternating so neighbouring pills don't stack
const opaque = selectable.filter(m => mats(m).every(x => !x.transparent));
const tmp = new THREE.Vector3(), centre = new THREE.Vector3(), toCam = new THREE.Vector3();
let frameCount = 0;
const occluded = {};
function placeLabels(){
  if (!getLabel) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  centre.set(0, 1.7, 0).project(camera);
  const cx = (centre.x * 0.5 + 0.5) * w, cy = (-centre.y * 0.5 + 0.5) * h;
  const checkOcclusion = frameCount++ % 6 === 0;
  ORDER.forEach((id, i) => {
    const el = getLabel(id);
    if (!el) return;
    const a = anchors[id];
    const world = tmp.set(a[0], a[1], a[2]);
    if (checkOcclusion) {
      // Hidden behind the Aurora itself? Then the label steps back.
      const dist = camera.position.distanceTo(world);
      toCam.copy(world).sub(camera.position).normalize();
      raycaster.set(camera.position, toCam);
      const hit = raycaster.intersectObjects(opaque, false)[0];
      occluded[id] = !!hit && hit.distance < dist - 0.08 && hit.object.userData.partId !== id;
    }
    world.project(camera);
    const ax = (world.x * 0.5 + 0.5) * w, ay = (-world.y * 0.5 + 0.5) * h;
    let dx = ax - cx, dy = ay - cy;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const Ld = (w < 560 ? LEADER_NARROW : LEADER)[i % 2];
    el.style.setProperty("--ax", ax.toFixed(1) + "px");
    el.style.setProperty("--ay", ay.toFixed(1) + "px");
    const ex = ax + dx * Ld, ey = ay + dy * Ld;
    el.style.setProperty("--ex", ex.toFixed(1) + "px");
    el.style.setProperty("--ey", ey.toFixed(1) + "px");
    el.style.setProperty("--len", Ld + "px");
    el.style.setProperty("--ang", Math.atan2(dy, dx).toFixed(4) + "rad");
    el.dataset.side = dx < 0 ? "left" : "right";
    // Keep the name inside the stage: slide it in from the edge if it would run off.
    const pill = el.lastElementChild;
    if (pill && (frameCount % 30 === 1 || !pillWidths.has(pill))) pillWidths.set(pill, pill.offsetWidth);
    const pw = pillWidths.get(pill) || 0;
    const px = dx < 0 ? Math.max(ex, pw + 2) : Math.min(ex, w - pw - 2);
    el.style.setProperty("--px", px.toFixed(1) + "px");
    el.style.setProperty("--py", Math.min(h - 16, Math.max(16, ey)).toFixed(1) + "px");
    el.dataset.hidden = occluded[id] ? "1" : "0";
    el.dataset.active = hoveredId === id ? "1" : "0";
  });
}

// Only render while on screen.
let visible = true;
const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
io.observe(stage);

let raf = 0, clockTime = 0;
function animate(){
  raf = requestAnimationFrame(animate);
  if (!visible || document.hidden) return;
  clockTime += 0.016;
  if (!reduced) {
    // Hydrogen micro-bubbles rise through the water (the prototype's own motion).
    for (const b of bubbles) {
      b.mesh.position.y += b.speed;
      b.mesh.position.x += Math.sin(clockTime * 2.4 + b.wobbleOffset) * 0.0008;
      if (b.mesh.position.y > 1.24) b.mesh.position.y = 0.12;
    }
  }
  // While turning by itself, keep the hover on whatever is now under the pointer.
  if (controls.autoRotate && lastPointer && !dragging) report(lastPointer.x, lastPointer.y);
  zoom.update();
  controls.update();
  renderer.render(scene, camera);
  placeLabels();
}
animate();

const dispose = () => {
  zoom.dispose();
  renderer.domElement.removeEventListener("pointerdown", onDown);
  renderer.domElement.removeEventListener("pointerup", onUp);
  cancelAnimationFrame(raf);
  window.clearTimeout(resumeTimer);
  sizeObserver.disconnect();
  io.disconnect();
  controls.dispose();
  renderer.domElement.removeEventListener("pointermove", onMove);
  renderer.domElement.removeEventListener("pointerleave", onLeave);
  scene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); }
  });
  neutralEnvMap.dispose();
  illuminatedGlassEnv.dispose();
  renderer.dispose();
  renderer.domElement.remove();
};
/** The page's part list: light a part (or clear with null). */
const highlight = id => { pinnedId = id; hoveredId = undefined; setHovered(null); };
return Object.assign(dispose, { zoomIn: zoom.zoomIn, zoomOut: zoom.zoomOut, highlight });
} finally {
  THREE.ColorManagement.enabled = colorManagement;
}
}
