import type { PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

/*
 * Zoom for the 3D product views, without ever taking the page's scroll: the page's + / − buttons
 * call zoomIn / zoomOut; a trackpad pinch (ctrl + wheel) and a two-finger pinch on touch screens
 * zoom too. A plain wheel and one-finger vertical swipes still scroll the page. The camera glides
 * in and out along its line to the model.
 */
export function makeZoom(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  el: HTMLElement,
  { min = 0.5, max = 1.35, step = 1.3, reduced = false } = {}
) {
  const base = camera.position.distanceTo(controls.target);
  let factor = 1;
  let goal = 1;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const set = (v: number) => {
    goal = clamp(v);
    if (reduced) factor = goal - 1e-4; // land almost at once
  };
  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return; // trackpad pinches arrive as ctrl + wheel
    e.preventDefault();
    set(goal * Math.exp(e.deltaY * 0.01));
  };
  // Two-finger pinch on touch screens.
  let pinchFrom = 0;
  let pinchGoal = 1;
  const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    pinchFrom = spread(e.touches);
    pinchGoal = goal;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 2 || !pinchFrom) return;
    e.preventDefault();
    set(pinchGoal * (pinchFrom / Math.max(1, spread(e.touches))));
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) pinchFrom = 0;
  };
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("touchstart", onTouchStart, { passive: true });
  el.addEventListener("touchmove", onTouchMove, { passive: false });
  el.addEventListener("touchend", onTouchEnd, { passive: true });
  el.addEventListener("touchcancel", onTouchEnd, { passive: true });
  return {
    zoomIn: () => set(goal / step),
    zoomOut: () => set(goal * step),
    /** Call each frame, before controls.update(). */
    update() {
      if (Math.abs(goal - factor) < 1e-4) return;
      factor += (goal - factor) * 0.14;
      const offset = camera.position.clone().sub(controls.target).setLength(base * factor);
      camera.position.copy(controls.target).add(offset);
    },
    dispose: () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    },
  };
}
