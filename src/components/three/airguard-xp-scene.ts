// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- untyped geometry ported verbatim from the prototype
// @ts-nocheck — the model geometry is ported verbatim from the approved prototype
// ("3D model of Airguard with controls … .html"); it is plain three.js and kept as written.
/*
 * AirGuard XP, interactive 3D model without any control panel. Visitors drag to turn it (it
 * turns slowly by itself, pausing while they interact); hovering a part tints it softly and
 * reports the part so the page can show its name. Zoom is by the + / − buttons or a pinch (never a
 * plain wheel), and there is no pan, so page scrolling is never
 * captured. Geometry, materials, LEDs and the display are the prototype's own.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeZoom } from "./zoom";

export type AirGuardPart = { id: string; name: string; title: string; copy: string };
export type HoverInfo = { part: AirGuardPart; x: number; y: number } | null;

export function mountAirGuard(
  stage: HTMLElement,
  {
    onHover,
    getLabel,
    reducedMotion = false,
    variant = "xp",
    theme = "light",
    getExplode,
    getFocus,
    onSelect,
    onPick,
    numberedDots = false,
  }: {
    onHover?: (info: HoverInfo) => void;
    /** The page's label element for each part; the scene keeps it pinned to its part. */
    getLabel?: (id: string) => HTMLElement | null;
    reducedMotion?: boolean;
    /** "mp" is the same guard without the XP's display, camera and their hinge mount. */
    variant?: "xp" | "mp";
    /** "dark": blue rim lights for a dark stage (product detail hero / anatomy). */
    theme?: "light" | "dark";
    /** 0 assembled … 1 fully pulled apart; read every frame and eased. */
    getExplode?: () => number;
    /** A part kept highlighted (tint + active label) when nothing is hovered. */
    getFocus?: () => string | null;
    /** A click (not a drag) on a part. */
    onSelect?: (id: string) => void;
    /** Home page: a part was tapped or clicked (or tapped again to clear) and stays lit: its id, or null. */
    onPick?: (id: string | null) => void;
    /** Home page: phones show numbered dots, so the model is drawn larger with short leader lines. */
    numberedDots?: boolean;
  } = {}
) {
const reduced = reducedMotion;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, stage.clientWidth / Math.max(1, stage.clientHeight), .1, 100);
camera.position.set(6.6, 5.2, 8.9); // close in: the guard fills the stage

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); // the section's own background shows through
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .86;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.domElement.style.touchAction = "pan-y"; // vertical swipes still scroll the page on touch
renderer.domElement.setAttribute("aria-hidden", "true");
stage.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const studioEnvironment = new RoomEnvironment();
scene.environment = pmrem.fromScene(studioEnvironment, 0.06).texture;
studioEnvironment.dispose();
scene.environmentIntensity = .6;
pmrem.dispose();

const controls = new OrbitControls(camera, renderer.domElement);
renderer.domElement.style.touchAction = "pan-y"; // OrbitControls sets "none"; vertical swipes must still scroll the page
controls.enableDamping = !reduced;
controls.dampingFactor = .07;
controls.enableZoom = false; // never captures the page's scroll
controls.enablePan = false;
controls.minPolarAngle = Math.PI * .18;
controls.maxPolarAngle = Math.PI * .62;
controls.target.set(0, .4, -.35);
controls.autoRotate = !reduced;
controls.autoRotateSpeed = .8;

scene.add(new THREE.HemisphereLight(0xf7f8fa, 0xa1a8a5, .55));
const key = new THREE.DirectionalLight(0xfffaf4, 1.65);
key.position.set(3, 9, 6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1; key.shadow.camera.far = 24;
key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
key.shadow.bias = -.00015; key.shadow.normalBias = .012; key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0xeef3fa, .6); rim.position.set(-5, 3, -6); scene.add(rim);
const warm = new THREE.DirectionalLight(0xfffaf4, .4); warm.position.set(5, 2, -2); scene.add(warm);
if (theme === "dark") {
  // Cinematic studio: the key drops a little and two brand-blue rims outline the guard from behind.
  key.intensity = 1.35;
  const blueA = new THREE.DirectionalLight(0x5b8be0, 2.4); blueA.position.set(-6, 4, -7); scene.add(blueA);
  const blueB = new THREE.DirectionalLight(0x4067b1, 1.8); blueB.position.set(6, 3, -6); scene.add(blueB);
  scene.environmentIntensity = .45;
}

const parts = [
  {
    id:"shield", name:"Aerosol barrier", title:"A clear working boundary.",
    copy:"A transparent shield sits above the treatment area, preserving visibility while providing a physical barrier.",
    fact:"Positioning", detail:"The product page describes positioning the shield approximately 12 inches above the patient.",
    offset:[0,-1.6,0]
  },
  {
    id:"suction", name:"Extra-oral suction", title:"Follow the path of the air.",
    copy:"The suction connection brings extra-oral air capture into the guard. Turn on Airflow to explore a simplified direction of travel.",
    fact:"Connection", detail:"The listed attachment cuff fits hoses 3–6 inches in diameter. Confirm compatibility with your suction system.",
    offset:[0,.1,-2.5]
  },
  {
    id:"lighting", name:"Under-glass LEDs", title:"Light across the working area.",
    copy:"Individual diode packages sit beneath the glass border in recessed metal channels, behind translucent covers. Switch to the underside view to inspect them.",
    fact:"Lighting options", detail:"Warm white, cool white, amber, and blue.",
    offset:[-2.2,.4,0]
  },
  {
    id:"precision", name:"Precision lighting", title:"Focus where it matters.",
    copy:"Four downward-facing corner assemblies include housings, reflectors, lens covers, and fasteners. The optional beams show direction and beam-angle changes.",
    fact:"Placement", detail:"Select this component and rotate the view to inspect the four spotlight positions.",
    offset:[2.2,.4,0]
  },
  {
    id:"magnification", name:"Display & magnification", title:"A closer view. A movable display.",
    copy:"Explore the white display housing, hinge barrels, rear ribs, and 1–10× demo magnification. Drag on the screen to pan the dental view, or tap the on-screen touch controls to zoom and capture.",
    fact:"Viewing", detail:"Use the flip control to raise the screen. The rear touch display is an optional visualization from your brief; published images show a solid rear casing.",
    offset:[0,1.5,.7]
  },
  {
    id:"camera", name:"HD camera", title:"A closer look. A shared view.",
    copy:"A tiny camera aperture sits behind the display. There is no separate camera pod beneath the clear shield. Capture and review the illustrative dental preview.",
    fact:"Integrated imaging", detail:"The exterior is modeled for inspection. Sensor size, internal electronics, autofocus performance, and frame rates are brief specifications, not simulated hardware.",
    offset:[0,2.3,-.7]
  },
  {id:"handle",name:"Handle & adjustment",title:"Position the guard comfortably.",copy:"The raised rear handle, mounting feet, and tension hardware are modeled separately. Use tilt and height to inspect positioning.",fact:"Adjustment",detail:"Movement in this explorer is illustrative; it does not establish the product’s measured travel or load limits.",offset:[0,1.45,-.6]},
  {id:"buttons",name:"Physical buttons",title:"Controls you can actually press.",copy:"Two front-edge control banks have raised surfaces and visible symbols. Click a button on the model or use the matching controls here.",fact:"Demo controls",detail:"Power, light color, brightness, magnification, capture, and screen flip are interactive. The function mapping is illustrative.",offset:[0,.6,1.3]}
];

const root = new THREE.Group(); scene.add(root);
const assemblies = {};
const selectable = [];
const lightMaterials = [];

const shell = new THREE.MeshPhysicalMaterial({
  color:0xe5e8e4, roughness:.48, metalness:0, ior:1.46, specularIntensity:.4,
  clearcoat:.06, clearcoatRoughness:.5, envMapIntensity:.65
});
const metal = new THREE.MeshStandardMaterial({
  color:0xb9c9d3, roughness:.17, metalness:.92, envMapIntensity:1.3
});
const glass = new THREE.MeshPhysicalMaterial({
  color:0xf8faf9, transmission:.98, thickness:.07,
  roughness:.065, metalness:0, ior:1.58, envMapIntensity:1,
  attenuationColor:0xf4f8f6, attenuationDistance:8,
  side:THREE.DoubleSide, depthWrite:true
});

for(const p of parts) {
  const g = new THREE.Group();
  g.userData.partId = p.id;
  assemblies[p.id] = g;
  root.add(g);
}

function mesh(geometry, material, parent, x=0, y=0, z=0) {
  const m = new THREE.Mesh(geometry, material.clone());
  m.position.set(x, y, z);
  m.castShadow = !(m.material.transmission > 0 || m.material.transparent);
  m.receiveShadow = true;
  parent.add(m);
  if(parent.userData.partId) {
    m.userData.partId = parent.userData.partId;
    selectable.push(m);
  }
  m.userData.baseColor = m.material.color.clone();
  return m;
}

function box(parent, w, h, d, mat, x=0, y=0, z=0) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
}

function cylinder(parent, r, h, mat, x=0, y=0, z=0) {
  return mesh(new THREE.CylinderGeometry(r, r, h, 48), mat, parent, x, y, z);
}

function roundShape(w, d, r) {
  const s = new THREE.Shape(), x = -w/2, z = -d/2;
  s.moveTo(x+r, z); s.lineTo(x+w-r, z);
  s.quadraticCurveTo(x+w, z, x+w, z+r);
  s.lineTo(x+w, z+d-r); s.quadraticCurveTo(x+w, z+d, x+w-r, z+d);
  s.lineTo(x+r, z+d); s.quadraticCurveTo(x, z+d, x, z+d-r);
  s.lineTo(x, z+r); s.quadraticCurveTo(x, z, x+r, z);
  return s;
}

function plate(parent, w, d, r, t, mat, y=0, z=0) {
  const geometry = new THREE.ExtrudeGeometry(roundShape(w, d, r), {
    depth:t, bevelEnabled:false, steps:1, curveSegments:16
  });
  geometry.rotateX(-Math.PI/2);
  return mesh(geometry, mat, parent, 0, y, z);
}

// Geometry follows the visible product renders. Dimensions are illustrative.
const liveState={power:true,functionToggle:true,lightIndex:0,brightness:1,flip:12,zoom:1,beam:25,cuff:4.5,tilt:0,lift:0,beams:true,rear:false,review:false,panX:0,panY:0};
const modes=[{hex:0x7196ff,label:'Blue · 470nm'},{hex:0xf0f5ff,label:'White · 6500K'},{hex:0xffba62,label:'Orange / amber · 2200K'}];
const deviceLights=[],beamMeshes=[],physicalButtons=[],displaySurfaces=[],diffuserMaterials=[];
const rubber=new THREE.MeshStandardMaterial({color:0x233538,roughness:.78,metalness:0});
const gasket=new THREE.MeshStandardMaterial({color:0x798d90,roughness:.65,metalness:.12});
const lensMat=new THREE.MeshPhysicalMaterial({color:0xbdd9ee,transmission:.78,transparent:true,roughness:.04,thickness:.08,ior:1.5,clearcoat:1,side:THREE.DoubleSide});
function rounded(parent,w,h,d,material,x=0,y=0,z=0,r=.045){return mesh(new RoundedBoxGeometry(w,h,d,5,Math.min(r,w/2,h/2,d/2)),material,parent,x,y,z)}
function group(parent,id){const g=new THREE.Group();g.userData.partId=id||parent.userData.partId;parent.add(g);return g}
function ring(parent,r,t,material,x,y,z){const m=mesh(new THREE.TorusGeometry(r,t,10,48),material,parent,x,y,z);m.rotation.x=Math.PI/2;return m}
function screw(parent,x,y,z,down=false){
  const g=group(parent);g.position.set(x,y,z);if(down)g.rotation.x=Math.PI;
  cylinder(g,.037,.02,metal,0,.006,0);
  box(g,.038,.004,.007,rubber,0,.018,0);box(g,.007,.004,.038,rubber,0,.018,0);
}
function frame(parent,w,d,insideW,insideD,thick,material,y=0){
  const sh=roundShape(w,d,.38),inner=roundShape(insideW,insideD,.25);
  sh.holes.push(new THREE.Path(inner.getPoints(48).reverse()));
  const geo=new THREE.ExtrudeGeometry(sh,{depth:thick,bevelEnabled:false,curveSegments:24});
  geo.rotateX(-Math.PI/2);return mesh(geo,material,parent,0,y,0);
}
function labelTexture(text,color='#3b5b60',size=64){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');
  ctx.clearRect(0,0,512,128);ctx.fillStyle=color;ctx.font=`600 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function topLabel(parent,text,x,y,z,w=.28,d=.09){
  const m=mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:labelTexture(text),transparent:true,depthWrite:false,side:THREE.DoubleSide}),parent,x,y,z);
  m.rotation.x=-Math.PI/2;m.userData.noTint=true;return m;
}

// Continuous molded surround, inset transparent plate, gasket, seams, fasteners.
frame(assemblies.shield,4.8,3.85,4.28,3.27,.12,shell,-.04);
frame(assemblies.shield,4.35,3.34,4.24,3.23,.024,gasket,.085);
plate(assemblies.shield,4.29,3.28,.27,.05,glass,.072);
frame(assemblies.shield,4.77,3.82,4.65,3.70,.028,shell,-.067);
const channelMetal=new THREE.MeshStandardMaterial({color:0x7f8b91,roughness:.29,metalness:.75});
frame(assemblies.lighting,4.68,3.73,4.29,3.34,.023,channelMetal,-.083);
frame(assemblies.lighting,4.70,3.75,4.64,3.69,.016,metal,-.098);
frame(assemblies.lighting,4.35,3.40,4.29,3.34,.016,metal,-.098);
const perimeterCover=frame(assemblies.lighting,4.65,3.70,4.34,3.39,.010,new THREE.MeshPhysicalMaterial({color:0xc6d4e1,transparent:true,opacity:.22,roughness:.14,metalness:.05,depthWrite:false,side:THREE.DoubleSide}),-.117);
perimeterCover.castShadow=false;
for(const x of [-2.22,2.22])for(const z of [-1.69,1.69])screw(assemblies.shield,x,.04,z);
for(const x of [-2.24,2.24])for(const z of [-1.65,0,1.65])screw(assemblies.shield,x,-.10,z,true);
// Fine front intake slots: thin lines, wider spacing, shallow extrusion — no heavy grille.
// Shallow grey front slot, fine white bridges and a subtle lower molded edge.
const frontSlotMaterial=new THREE.MeshStandardMaterial({color:0x858b86,roughness:.8,metalness:0});
rounded(assemblies.shield,3.85,.025,.006,frontSlotMaterial,0,.005,1.928,.003);
for(let i=0;i<15;i++)box(assemblies.shield,.020,.025,.008,shell,(i-7)*.247,.005,1.931);
rounded(assemblies.shield,3.88,.010,.009,shell,0,-.013,1.930,.003);

// Broad rear hood blends a low capture opening into the hose collar.
const loftPositions=[],loftIndices=[],N=64,S=18;
for(let j=0;j<=S;j++){
  const t=j/S,e=t*t*(3-2*t),w=3.82*(1-e)+1.08*e,h=.30*(1-e)+.88*e;
  for(let i=0;i<N;i++){
    const a=i/N*Math.PI*2,c=Math.cos(a),sn=Math.sin(a);
    loftPositions.push(Math.sign(c)*Math.pow(Math.abs(c),.6)*w/2,.16+e*.20+Math.sign(sn)*Math.pow(Math.abs(sn),.7)*h/2,-1.73-t*1.35);
  }
}
for(let j=0;j<S;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=a+N,d=b+N;loftIndices.push(a,b,c,b,d,c)}
const loft=new THREE.BufferGeometry();loft.setAttribute('position',new THREE.Float32BufferAttribute(loftPositions,3));loft.setIndex(loftIndices);loft.computeVertexNormals();
const hood=mesh(loft,shell,assemblies.suction);hood.material.side=THREE.DoubleSide;
const intakeShape=new THREE.Shape();intakeShape.moveTo(-1.93,-1.72);intakeShape.lineTo(1.93,-1.72);intakeShape.quadraticCurveTo(1.90,-2.30,0,-2.39);intakeShape.quadraticCurveTo(-1.90,-2.30,-1.93,-1.72);
const intakeGeo=new THREE.ShapeGeometry(intakeShape,48);intakeGeo.rotateX(Math.PI/2);
mesh(intakeGeo,new THREE.MeshStandardMaterial({color:0x293238,roughness:.85,side:THREE.DoubleSide}),assemblies.suction,0,-.095,0);
for(let i=0;i<37;i++){
  const x=(i-18)*.099,depth=.15+.48*Math.sqrt(Math.max(0,1-(x/1.92)**2));
  const rib=rounded(assemblies.suction,.031,.028,depth,shell,x,-.12,-1.73-depth/2,.01);rib.rotation.x=-.09;
}
for(const x of [-1.88,1.88])screw(assemblies.suction,x,-.14,-1.76,true);
const cuffGroup=group(assemblies.suction);cuffGroup.position.set(0,.45,-3.04);
const collar=cylinder(cuffGroup,.56,.64,shell,0,0,-.15);collar.rotation.x=Math.PI/2;
// Smooth white molded cuff and white end face, matching the product reference.
for(const z of [-.12,-.42])mesh(new THREE.TorusGeometry(.558,.006,8,64),shell,cuffGroup,0,0,z);
const cuffSleeve=cylinder(cuffGroup,.485,.70,shell,0,0,-.72);cuffSleeve.rotation.x=Math.PI/2;
const cuffEnd=cylinder(cuffGroup,.478,.018,shell,0,0,-1.071);cuffEnd.rotation.x=Math.PI/2;
mesh(new THREE.TorusGeometry(.456,.017,12,64),shell,cuffGroup,0,0,-1.084);
const cuffBrand=mesh(new THREE.PlaneGeometry(.58,.15),new THREE.MeshBasicMaterial({map:labelTexture('AirGuard','#aeb5ae'),transparent:true,depthWrite:false}),cuffGroup,0,0,-1.087);
cuffBrand.rotation.y=Math.PI;cuffBrand.userData.noTint=true;

// Raised rear handle, mounting feet, grip profile, adjustment hardware.
const handleCurve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.93,.17,-1.54),new THREE.Vector3(-1.8,.97,-1.85),new THREE.Vector3(-1.33,1.36,-2.05),
  new THREE.Vector3(0,1.43,-2.10),new THREE.Vector3(1.33,1.36,-2.05),new THREE.Vector3(1.8,.97,-1.85),new THREE.Vector3(1.93,.17,-1.54)
]);
mesh(new THREE.TubeGeometry(handleCurve,72,.095,12,false),shell,assemblies.handle);
for(const x of [-1.93,1.93]){cylinder(assemblies.handle,.14,.11,shell,x,.19,-1.54);screw(assemblies.handle,x,.26,-1.54)}
// Rear housing toggle: washer, hex nut, tilted metal stem, rounded tip.
const toggleMount=group(assemblies.suction);toggleMount.position.set(0,.700,-2.67);
const washer=cylinder(toggleMount,.074,.016,metal,0,0,0);washer.userData.action='functionToggle';
const nut=mesh(new THREE.CylinderGeometry(.055,.055,.03,6),metal,toggleMount,0,.02,0);nut.userData.action='functionToggle';
const functionLever=group(toggleMount);functionLever.position.y=.042;
cylinder(functionLever,.018,.16,metal,0,.075,0).userData.action='functionToggle';
mesh(new THREE.SphereGeometry(.019,16,8),metal,functionLever,0,.155,0).userData.action='functionToggle';

topLabel(assemblies.handle,'AirGuard',0,1.535,-2.08,.8,.18);

// Actual underside light channels with individual diode packages and diffuser covers.
function emitter(parent,x,y,z,w,d){
  const mat=new THREE.MeshStandardMaterial({color:0xe4f3ff,emissive:0xe4f3ff,emissiveIntensity:2.6,roughness:.18});
  const m=rounded(parent,w,.025,d,mat,x,y,z,.009);m.castShadow=false;lightMaterials.push(m.material);return m;
}
const ledGlows=[],stripLights=[];
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
const glowCtx=glowCanvas.getContext('2d'),halo=glowCtx.createRadialGradient(32,32,1,32,32,32);
halo.addColorStop(0,'rgba(255,255,255,1)');halo.addColorStop(.18,'rgba(255,255,255,.75)');halo.addColorStop(.48,'rgba(255,255,255,.22)');halo.addColorStop(1,'rgba(255,255,255,0)');
glowCtx.fillStyle=halo;glowCtx.fillRect(0,0,64,64);const glowTexture=new THREE.CanvasTexture(glowCanvas);
function lightRail(x,z,len,across=false){
  const rail=group(assemblies.lighting);rail.position.set(x,-.081,z);if(across)rail.rotation.y=Math.PI/2;
  rounded(rail,.13,.018,len,channelMetal,0,0,0,.007);
  const count=Math.floor((len-.08)/.115);
  for(let i=0;i<count;i++){
    const zz=(i-(count-1)/2)*.115;
    rounded(rail,.069,.008,.062,shell,0,-.014,zz,.005);
    emitter(rail,0,-.030,zz,.042,.043);
    const glow=mesh(new THREE.PlaneGeometry(.16,.16),new THREE.MeshBasicMaterial({map:glowTexture,color:0x4975ff,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false}),rail,0,-.049,zz);
    glow.rotation.x=Math.PI/2;glow.castShadow=false;glow.userData.noTint=true;glow.userData.hitPassthrough=true;ledGlows.push(glow);
  }
  const cover=rounded(rail,.135,.009,len-.018,new THREE.MeshPhysicalMaterial({color:0xd0e0ed,emissive:0x315dff,emissiveIntensity:.7,transparent:true,opacity:.26,roughness:.13,depthWrite:false}),0,-.047,0,.004);
  cover.castShadow=false;diffuserMaterials.push(cover.material);
  for(const zz of [-len/2+.035,len/2-.035])screw(rail,0,-.052,zz,true);
  for(const zz of [-len*.32,0,len*.32]){const fill=new THREE.PointLight(0x4975ff,1.2,2.6,2);fill.position.set(0,-.12,zz);rail.add(fill);stripLights.push(fill)}
}
lightRail(-2.245,0,2.93);lightRail(2.245,0,2.93);lightRail(0,1.78,3.95,true);

// Four downward-facing optical assemblies; beam visualization is intentionally schematic.
for(const x of [-2.17,2.17])for(const z of [-1.60,1.60]){
  const g=group(assemblies.precision);g.position.set(x,-.066,z);
  ring(g,.088,.012,metal,0,-.039,0);
  const reflector=mesh(new THREE.CylinderGeometry(.080,.057,.022,48,1,true),metal,g,0,-.025,0);reflector.material.side=THREE.DoubleSide;
  emitter(g,0,-.027,0,.037,.037);
  const lens=mesh(new THREE.SphereGeometry(.076,32,16),lensMat,g,0,-.047,0);lens.scale.y=.08;lens.castShadow=false;
  for(const xx of [-.108,.108])screw(g,xx,-.043,0,true);
  const target=new THREE.Object3D();target.position.set(-x*.65,-2.1,-z*.65);g.add(target);
  const lamp=new THREE.SpotLight(0xe4f3ff,2,7,THREE.MathUtils.degToRad(12.5),.6,1.4);
  lamp.position.set(0,-.18,0);lamp.target=target;g.add(lamp);deviceLights.push(lamp);
  const length=2.1;const beam=mesh(new THREE.ConeGeometry(1,length,40,1,true),new THREE.MeshBasicMaterial({color:0xe4f3ff,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),g,0,0,0);
  beam.userData.noTint=true;beam.userData.length=length;
  const direction=new THREE.Vector3(-x*.65,-2.1,-z*.65).normalize();beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),direction);
  beam.position.copy(direction.clone().multiplyScalar(length/2)).add(new THREE.Vector3(0,-.18,0));
  beam.visible=false;beam.castShadow=false;beamMeshes.push(beam);
}

// The display hinges on the molded plastic chassis, not the glass panel:
// a rigid mount block on the rear frame rail carries the hinge barrels, and
// the screen pivot axis sits at the top edge of that plastic bezel mount.
const hingeMount=group(assemblies.shield);hingeMount.position.set(0,0,-1.72);
rounded(hingeMount,.72,.12,.26,shell,0,.045,-.28,.03);
rounded(hingeMount,1.06,.30,.62,shell,0,.25,-.12,.07);
for(const x of [-.80,.80]){
  rounded(hingeMount,.24,.15,.23,shell,x,.34,0,.025);
  const barrel=cylinder(hingeMount,.085,.28,metal,x,.385,0);barrel.rotation.z=Math.PI/2;
}
// AirGuard branding on the plastic housing where the screen attaches.
topLabel(hingeMount,'AirGuard',0,.405,-.10,.62,.15);
const displayPivot=group(assemblies.magnification);displayPivot.position.set(0,.385,-1.72);
rounded(displayPivot,2.53,1.65,.14,shell,0,.90,0,.085);
rounded(displayPivot,.55,.43,.12,shell,0,.18,0,.04);
const screenCanvas=document.createElement('canvas');screenCanvas.width=1024;screenCanvas.height=640;
const screenContext=screenCanvas.getContext('2d');
const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;
screenTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
function screenSurface(front){
  const mat=new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false});
  const surface=mesh(new THREE.PlaneGeometry(2.25,1.40625),mat,displayPivot,0,.92,front?-.076:.076);
  if(front)surface.rotation.y=Math.PI;
  surface.userData.noTint=true;surface.userData.action='screen';displaySurfaces.push(surface);return surface;
}
screenSurface(true);const rearDisplay=screenSurface(false);rearDisplay.visible=false;
const backDetails=group(displayPivot);
for(const x of [-.75,.75])rounded(backDetails,.036,1.25,.028,shell,x,.94,.086,.013);
for(const x of [-1.12,0,1.12])for(const y of [.20,1.58]){
  const head=cylinder(backDetails,.022,.008,gasket,x,y,.080);head.rotation.x=Math.PI/2;
}
const backBrand=mesh(new THREE.PlaneGeometry(.75,.19),new THREE.MeshBasicMaterial({map:labelTexture('AirGuard','#8a9b9d'),transparent:true,depthWrite:false}),backDetails,0,1.25,.082);backBrand.userData.noTint=true;
for(const front of [true,false]){
  const glassFace=rounded(displayPivot,2.27,1.425,.007,new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.08,roughness:.055,metalness:.25,clearcoat:1,depthWrite:false}),0,.92,front?-.083:.083,.012);glassFace.castShadow=false;glassFace.userData.noTint=true;glassFace.userData.hitPassthrough=true;
}
const capturedFrame=null;
const touchZones=[];
function roundRectPath(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
// Occlusal-view dentition: two arches of individually shaded teeth.
function drawDentition(c,state){
  const g=c.createRadialGradient(512,320,50,512,320,470);
  g.addColorStop(0,'#1d3f42');g.addColorStop(.55,'#0e272c');g.addColorStop(1,'#07151b');
  c.fillStyle=g;c.fillRect(24,96,976,450);
  c.save();c.beginPath();c.rect(24,96,976,450);c.clip();
  c.translate(512+state.panX,322+state.panY);c.scale(state.zoom,state.zoom);
  const tissue=c.createRadialGradient(0,0,30,0,0,300);
  tissue.addColorStop(0,'rgba(146,84,84,.34)');tissue.addColorStop(1,'rgba(146,84,84,0)');
  c.fillStyle=tissue;c.beginPath();c.ellipse(0,0,300,260,0,0,Math.PI*2);c.fill();
  for(const arch of [{rx:210,ry:150,off:-42,dir:-1},{rx:168,ry:118,off:52,dir:1}]){
    const n=14;
    for(let i=0;i<n;i++){
      const t=i/(n-1),a=Math.PI*(.14+.72*t);
      const x=Math.cos(a)*arch.rx,y=arch.dir*Math.sin(a)*arch.ry+arch.off;
      const rot=Math.atan2(arch.dir*arch.ry*Math.cos(a),-arch.rx*Math.sin(a));
      const molar=Math.abs(t-.5)*2,w=30+12*molar*molar,h=34+6*molar;
      const s=232+Math.round(14*Math.sin(i*7.31+arch.rx));
      c.save();c.translate(x,y);c.rotate(rot);
      c.fillStyle=`rgb(${s},${s-9},${s-30})`;
      roundRectPath(c,-w/2,-h/2,w,h,8);c.fill();
      c.strokeStyle='rgba(110,88,58,.4)';c.lineWidth=1.6;c.stroke();
      if(molar>.55){c.strokeStyle='rgba(140,112,72,.5)';c.lineWidth=2;c.beginPath();c.moveTo(-w/3.2,0);c.lineTo(w/3.2,0);c.moveTo(0,-h/3.4);c.lineTo(0,h/3.4);c.stroke()}
      c.restore();
    }
  }
  c.restore();
}
// Touch buttons drawn into the screen texture; zones are hit-tested on tap.
function drawTouchControls(c){
  touchZones.length=0;
  for(const b of [{y:196,icon:'+',action:'zoomIn'},{y:306,icon:'−',action:'zoomOut'},{y:416,icon:'cam',action:'capture'},{y:526,icon:'flip',action:'flip'}]){
    const x=952,r=42;
    c.beginPath();c.arc(x,b.y,r,0,Math.PI*2);
    c.fillStyle='rgba(13,38,44,.82)';c.fill();
    c.strokeStyle='#3f857e';c.lineWidth=3;c.stroke();
    c.strokeStyle='#c8ece5';c.fillStyle='#c8ece5';c.lineCap='round';
    if(b.icon==='+'||b.icon==='−'){c.lineWidth=5;c.beginPath();c.moveTo(x-16,b.y);c.lineTo(x+16,b.y);if(b.icon==='+'){c.moveTo(x,b.y-16);c.lineTo(x,b.y+16)}c.stroke()}
    else if(b.icon==='cam'){c.lineWidth=4;c.strokeRect(x-19,b.y-10,38,26);c.beginPath();c.arc(x,b.y+3,8,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x-8,b.y-10);c.lineTo(x-5,b.y-16);c.lineTo(x+5,b.y-16);c.lineTo(x+8,b.y-10);c.stroke()}
    else{c.lineWidth=4;c.beginPath();c.moveTo(x-17,b.y+12);c.lineTo(x+15,b.y+12);c.moveTo(x-8,b.y+11);c.lineTo(x+2,b.y-13);c.lineTo(x+17,b.y-4);c.stroke()}
    touchZones.push({x:x-r,y:b.y-r,w:r*2,h:r*2,action:b.action});
  }
}
function drawDisplay(){
  const c=screenContext,w=1024,h=640;c.fillStyle='#07151b';c.fillRect(0,0,w,h);
  if(!liveState.power){touchZones.length=0;c.fillStyle='#33505a';c.font='36px Arial';c.textAlign='center';c.fillText('AIRGUARD XP',w/2,h/2);screenTexture.needsUpdate=true;return}
  const state=liveState.review&&capturedFrame?capturedFrame:liveState;
  drawDentition(c,state);
  c.textAlign='left';c.fillStyle='#91d9ca';c.font='bold 27px Arial';c.fillText(liveState.review?'CAPTURE REVIEW · DEMO':'INTRA-ORAL VIEW · DEMO',32,48);
  c.textAlign='right';c.fillStyle='#fff';c.fillText(state.zoom.toFixed(1)+'×',880,48);
  c.textAlign='center';c.fillStyle='#d5e5e8';c.font='25px Arial';c.fillText('Demo dentition render • No clinical camera connected',460,585);
  c.fillStyle='#6f939e';c.font='20px Arial';c.fillText('Drag to pan · pinch, scroll or tap + / − to zoom · ◉ captures',460,621);
  drawTouchControls(c);
  screenTexture.needsUpdate=true;
}

// Tiny flush camera aperture in the rear display housing; no underside camera or bracket.
displayPivot.add(assemblies.camera);
rounded(assemblies.camera,.095,.095,.006,gasket,0,.79,.077,.008);
const cameraLens=rounded(assemblies.camera,.057,.057,.003,new THREE.MeshPhysicalMaterial({color:0x546a83,roughness:.16,metalness:.25,clearcoat:1}),0,.79,.082,.005);
cameraLens.name='Small camera aperture behind screen';cameraLens.userData.noTint=true;

// Two physical button banks on the front lip. Functions are prototype interactions.
function buttonGlyph(type){
  const c=document.createElement('canvas');c.width=c.height=128;const d=c.getContext('2d');d.strokeStyle='#a7ada7';d.fillStyle='#a7ada7';d.lineWidth=6;d.lineCap='round';
  if(type==='power'){d.beginPath();d.arc(64,69,33,-Math.PI*.32,Math.PI*1.32);d.stroke();d.beginPath();d.moveTo(64,20);d.lineTo(64,62);d.stroke()}
  else if(type==='plus'||type==='minus'){d.beginPath();d.moveTo(32,64);d.lineTo(96,64);if(type==='plus'){d.moveTo(64,32);d.lineTo(64,96)}d.stroke()}
  else if(type==='camera'){d.strokeRect(24,39,80,58);d.beginPath();d.arc(64,68,17,0,Math.PI*2);d.stroke();d.strokeRect(44,28,34,10)}
  else if(type==='flip'){d.beginPath();d.moveTo(24,91);d.lineTo(103,91);d.moveTo(42,90);d.lineTo(67,28);d.lineTo(105,45);d.stroke()}
  else {for(const r of [12,25,38]){d.beginPath();d.arc(64,64,r,0,Math.PI*2);d.stroke()}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const buttonBrief=[[-1.72,'color','color','MODE'],[-1.31,'minus','dim','DIM'],[-.91,'plus','bright','LIGHT'],[-.51,'power','power','POWER'],[.51,'camera','capture','PHOTO'],[.91,'minus','zoomOut','ZOOM −'],[1.31,'plus','zoomIn','ZOOM +'],[1.72,'flip','flip','FLIP']];
for(const [x,glyph,action] of buttonBrief){
  const b=group(assemblies.buttons);b.position.set(x,.071,1.76);b.userData.action=action;b.userData.restY=b.position.y;b.userData.press=0;
  // Symbols are printed directly on the white fascia, without raised round caps.
  const face=mesh(new THREE.PlaneGeometry(.145,.145),new THREE.MeshBasicMaterial({map:buttonGlyph(glyph),transparent:true,depthWrite:false,side:THREE.DoubleSide}),b,0,.010,0);face.rotation.x=-Math.PI/2;face.userData.action=action;face.userData.noTint=true;
  physicalButtons.push(b);
}

// ── Device state: lights on in white, display showing its demo view (no controls). ──
liveState.lightIndex = 1; // white
liveState.beams = false;
function syncDevice(){
  const mode=modes[liveState.lightIndex],power=liveState.power?liveState.brightness:0;
  lightMaterials.forEach(m=>{m.color.setHex(power?mode.hex:0xcbd2cd);m.emissive.setHex(mode.hex);m.emissiveIntensity=power*8});
  diffuserMaterials.forEach(m=>{m.emissive.setHex(mode.hex);m.emissiveIntensity=power*1.1});
  deviceLights.forEach(l=>{l.color.setHex(mode.hex);l.intensity=power*16;l.angle=THREE.MathUtils.degToRad(liveState.beam/2)});
  beamMeshes.forEach(m=>{m.visible=false});
  ledGlows.forEach(m=>{m.material.color.setHex(mode.hex);m.material.opacity=.9*power;m.visible=power>0});
  stripLights.forEach(l=>{l.color.setHex(mode.hex);l.intensity=power*.65});
  rearDisplay.visible=false;backDetails.visible=true;
  functionLever.rotation.x=.30;
  drawDisplay();
}

// AirGuard MP: XP's barrier, suction and lighting without the camera / magnification layer.
if (variant === "mp") {
  assemblies.magnification.visible = false; // the display; the camera sits inside it
  hingeMount.visible = false;
}

// Studio shadow under the lowest point of the model.
const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .16, color: 0x3b4a66, depthWrite: false }));
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);
{
  root.updateMatrixWorld(true);
  const box3 = new THREE.Box3();
  root.traverse(m => { if (m.isMesh && !beamMeshes.includes(m)) box3.expandByObject(m); });
  shadowFloor.position.y = box3.min.y - .015;
}

// ── Hover: the part under the pointer glows faintly; the page shows its name. ──
const HOVER_TINT = new THREE.Color(0x4067b1);
let hoveredId = null, focusId = null, tintedId = null;
let pinnedId = null; // home page: tapped (phones) or clicked part, kept lit until tapped again
const litId = () => hoveredId ?? pinnedId ?? focusId;
function setHovered(id){
  if (id === hoveredId) return;
  hoveredId = id;
  refreshTint();
  renderer.domElement.style.cursor = id ? "pointer" : "grab";
}
function refreshTint(){
  const id = litId();
  if (id === tintedId) return;
  tintedId = id;
  for (const m of selectable) {
    if (lightMaterials.includes(m.material) || m.userData.noTint || !m.material.emissive) continue;
    const on = id && m.userData.partId === id;
    m.material.emissive.copy(on ? HOVER_TINT : new THREE.Color(0));
    m.material.emissiveIntensity = on ? .22 : 1;
  }
}
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
let dragging = false, lastPointer = null;
function shown(o){ for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; }
function pickAt(clientX, clientY){
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(selectable.filter(m => !beamMeshes.includes(m) && !m.userData.hitPassthrough && shown(m))).find(h => h.object.material.opacity !== 0);
  return hit ? hit.object.userData.partId : null;
}
function report(clientX, clientY){
  const id = dragging ? null : pickAt(clientX, clientY);
  setHovered(id);
  const r = renderer.domElement.getBoundingClientRect();
  const part = id && parts.find(p => p.id === id);
  onHover?.(part ? { part: { id: part.id, name: part.name, title: part.title, copy: part.copy }, x: clientX - r.left, y: clientY - r.top } : null);
}
const onMove = e => { lastPointer = { x: e.clientX, y: e.clientY }; report(e.clientX, e.clientY); };
const onLeave = () => { lastPointer = null; setHovered(null); onHover?.(null); };
renderer.domElement.addEventListener("pointermove", onMove);
renderer.domElement.addEventListener("pointerleave", onLeave);
// A press that barely moves is a click on a part.
let downAt = null;
const onDown = e => { downAt = { x: e.clientX, y: e.clientY }; };
const onUp = e => {
  if (!downAt || (!onSelect && !onPick)) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  const id = moved > 8 ? null : pickAt(e.clientX, e.clientY);
  if (onSelect && id && moved <= 5) onSelect(id);
  // Tap (or click) a part to keep it lit and its name shown; tap it again to clear.
  if (onPick && moved <= 8) {
    pinnedId = id && id !== pinnedId ? id : null;
    setHovered(e.pointerType === "mouse" ? id : null);
    refreshTint();
    onPick(pinnedId);
  }
};
renderer.domElement.addEventListener("pointerdown", onDown);
renderer.domElement.addEventListener("pointerup", onUp);
renderer.domElement.style.cursor = "grab";

// Auto-turn pauses while the visitor interacts, and picks up again a few seconds later.
let resumeTimer = 0;
controls.addEventListener("start", () => { dragging = true; controls.autoRotate = false; window.clearTimeout(resumeTimer); setHovered(null); onHover?.(null); });
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
  camera.zoom = Math.min(1, (w / h) / (numberedDots && w < 560 ? 1.05 : 1.25)); // phones with numbered dots: the model can be larger
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
};
const sizeObserver = new ResizeObserver(resize);
sizeObserver.observe(stage);
resize();

// ── Labels: every part has one, pinned to an anchor point on it (in that part's own space). ──
const anchors = {
  shield: [assemblies.shield, [1.15, .1, .9]],
  suction: [cuffGroup, [0, .35, -.9]],
  lighting: [assemblies.lighting, [-2.25, -.1, .9]],
  precision: [assemblies.precision, [2.17, -.1, 1.6]],
  magnification: [displayPivot, [-.9, 1.45, -.08]],
  camera: [displayPivot, [0, .79, .09]],
  handle: [assemblies.handle, [-1.33, 1.36, -2.05]],
  buttons: [assemblies.buttons, [-1.1, .08, 1.76]],
};
const LEADER = [64, 92]; // px, alternating so neighbouring pills don't stack
const LEADER_NARROW = [26, 40]; // phones with numbered dots: short lines, so the names stay on screen
const pillWidths = new WeakMap();
const tmp = new THREE.Vector3(), centre = new THREE.Vector3(), toCam = new THREE.Vector3();
let frameCount = 0;
const occluded = {};
function placeLabels(){
  if (!getLabel) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  root.updateMatrixWorld(true);
  centre.set(0, .5, -.4).applyMatrix4(root.matrixWorld).project(camera);
  const cx = (centre.x * .5 + .5) * w, cy = (-centre.y * .5 + .5) * h;
  const checkOcclusion = frameCount++ % 6 === 0;
  parts.forEach((p, i) => {
    const el = getLabel(p.id);
    const a = anchors[p.id];
    if (!el || !a) return;
    const world = tmp.set(a[1][0], a[1][1], a[1][2]).applyMatrix4(a[0].matrixWorld);
    if (checkOcclusion) {
      // Hidden behind the guard itself? Then the label steps back.
      const dist = camera.position.distanceTo(world);
      toCam.copy(world).sub(camera.position).normalize();
      raycaster.set(camera.position, toCam);
      const hit = raycaster.intersectObjects(selectable.filter(m => !beamMeshes.includes(m) && !m.userData.hitPassthrough && m.material.opacity !== 0 && !(m.material.transmission > 0) && shown(m)), false)[0];
      occluded[p.id] = !!hit && hit.distance < dist - .12 && hit.object.userData.partId !== p.id;
    }
    world.project(camera);
    const ax = (world.x * .5 + .5) * w, ay = (-world.y * .5 + .5) * h;
    let dx = ax - cx, dy = ay - cy;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const L = (numberedDots && w < 560 ? LEADER_NARROW : LEADER)[i % 2];
    const ex = ax + dx * L, ey = ay + dy * L;
    el.style.setProperty("--ax", ax.toFixed(1) + "px");
    el.style.setProperty("--ay", ay.toFixed(1) + "px");
    el.style.setProperty("--ex", ex.toFixed(1) + "px");
    el.style.setProperty("--ey", ey.toFixed(1) + "px");
    el.style.setProperty("--len", L + "px");
    el.style.setProperty("--ang", Math.atan2(dy, dx).toFixed(4) + "rad");
    // Keep the name inside the stage: slide it in from the edge if it would run off (--px / --py).
    const pill = el.lastElementChild;
    if (pill && (frameCount % 30 === 1 || !pillWidths.has(pill))) pillWidths.set(pill, pill.offsetWidth);
    const pw = pillWidths.get(pill) || 0;
    const px = dx < 0 ? Math.max(ex, pw + 2) : Math.min(ex, w - pw - 2);
    el.style.setProperty("--px", px.toFixed(1) + "px");
    el.style.setProperty("--py", Math.min(h - 16, Math.max(16, ey)).toFixed(1) + "px");
    el.dataset.side = dx < 0 ? "left" : "right";
    el.dataset.hidden = occluded[p.id] ? "1" : "0";
    el.dataset.active = litId() === p.id ? "1" : "0";
  });
}

// Only render while on screen.
let visible = true;
const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
io.observe(stage);

displayPivot.rotation.x = THREE.MathUtils.degToRad(90 - liveState.flip);
syncDevice();

let raf = 0, explode = 0, lastT = performance.now();
function animate(){
  raf = requestAnimationFrame(animate);
  const now = performance.now(), dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  if (!visible || document.hidden) return;
  // Pull apart: ease toward the page's value and move each part out along its own offset.
  if (getExplode) {
    const target = Math.max(0, Math.min(1, getExplode()));
    explode = reduced ? target : THREE.MathUtils.damp(explode, target, 7, dt);
    for (const p of parts) assemblies[p.id].position.set(p.offset[0] * explode, p.offset[1] * explode, p.offset[2] * explode);
  }
  if (getFocus) { const f = getFocus(); if (f !== focusId) { focusId = f; refreshTint(); } }
  // While turning by itself, keep the hover label pinned to whatever is now under the pointer.
  if (controls.autoRotate && lastPointer && !dragging) report(lastPointer.x, lastPointer.y);
  zoom.update();
  controls.update();
  renderer.render(scene, camera);
  placeLabels();
}
animate();

const dispose = () => {
  zoom.dispose();
  cancelAnimationFrame(raf);
  window.clearTimeout(resumeTimer);
  sizeObserver.disconnect();
  io.disconnect();
  controls.dispose();
  renderer.domElement.removeEventListener("pointermove", onMove);
  renderer.domElement.removeEventListener("pointerleave", onLeave);
  renderer.domElement.removeEventListener("pointerdown", onDown);
  renderer.domElement.removeEventListener("pointerup", onUp);
  scene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); }
  });
  scene.environment?.dispose();
  renderer.dispose();
  renderer.domElement.remove();
};

/** The home page's part list: light a part (or clear with null). */
const highlight = id => { pinnedId = id; refreshTint(); };
return Object.assign(dispose, { zoomIn: zoom.zoomIn, zoomOut: zoom.zoomOut, highlight });
}
