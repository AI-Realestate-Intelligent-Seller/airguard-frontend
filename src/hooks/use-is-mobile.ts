"use client";

import { useSyncExternalStore } from "react";

const mobileQuery = "(max-width: 640px)";

function subscribeMobile(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const getMobileSnapshot = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia(mobileQuery).matches;
};

const getMobileServerSnapshot = () => false;

export function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
}
