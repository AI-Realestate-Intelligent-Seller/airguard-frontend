"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent } from "react";

/** Track the spotlight without transforming the card's pointer hit area. */
export function useCardHover<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = ref.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      element.style.setProperty("--x", `${clientX - bounds.left}px`);
      element.style.setProperty("--y", `${clientY - bounds.top}px`);
    });
  }, []);

  return { ref, onPointerMove };
}

export const CARD_HOVER_CLASS = "smooth-card";
