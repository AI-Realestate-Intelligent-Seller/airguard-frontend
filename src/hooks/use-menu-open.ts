"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the products mega-menu is open.
 *
 * The hero needs to know: its product art is animated, so the browser promotes
 * it to its own compositor layer mid-flight, and a freshly promoted layer can
 * paint over the menu for a few frames even though the header sits above it in
 * the stacking order. While the menu is open the hero holds its art back and
 * stops auto-advancing, so there is nothing to mis-composite.
 */
let open = false;
const listeners = new Set<() => void>();

export function setMenuOpen(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMenuOpen() {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false // never open during SSR
  );
}
