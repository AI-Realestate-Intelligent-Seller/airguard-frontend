"use client";

import { useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 1024px)";

/** True on lg screens and up, where the pinned scroll scenes run. */
export function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(desktopQuery);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(desktopQuery).matches,
    () => false
  );
}
