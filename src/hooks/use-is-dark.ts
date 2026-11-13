"use client";

import { useSyncExternalStore } from "react";

/*
 * Whether the dark theme is on: a `dark` class on <html> (set before first paint by THEME_SCRIPT in
 * lib/theme and flipped by the theme toggle). Re-renders when it changes. The server render assumes
 * light; the real value is read on the client.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export const isDarkTheme = () => document.documentElement.classList.contains("dark");

export function useIsDark() {
  return useSyncExternalStore(subscribe, isDarkTheme, () => false);
}
