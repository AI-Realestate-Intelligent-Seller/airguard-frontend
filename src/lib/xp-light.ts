import { useSyncExternalStore } from "react";

/*
 * The AirGuard XP's current LED colour on the home page (its lights cycle on their own), shared
 * so the Health → Wellness handoff can carry that light down into the King Hydrogen water.
 */
let color = "#eef4ff";
const listeners = new Set<() => void>();

export function setXpLight(next: string) {
  if (next === color) return;
  color = next;
  listeners.forEach((l) => l());
}

export function useXpLight() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => color,
    () => "#eef4ff"
  );
}
