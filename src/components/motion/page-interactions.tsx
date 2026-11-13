"use client";
import { useEffect, useState } from "react";

export const chapters = [
  ["discover", "Discover"], ["journey", "The journey"], ["our-world", "Our world"], ["airguard-3d", "Up close"], ["aurora-3d", "The Aurora"], ["book-store", "Book store"], ["arcane-herbs", "Arcane Herbs"],
  ["contact", "Connect"],
];

export function PageInteractions() {
  const [active, setActive] = useState("discover");
  useEffect(() => {
    const sections = chapters.map(([id]) => document.getElementById(id)).filter((s): s is HTMLElement => !!s);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-20% 0px -55% 0px", threshold: 0 });
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let previous: HTMLElement | null = null;
    let dark: HTMLElement | null = null;
    const reset = () => {
      previous?.style.removeProperty("translate");
      dark?.style.removeProperty("--cursor-light");
      previous = null; dark = null;
    };
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        reset();
        if (!media.matches) return;
        const target = e.target as HTMLElement;
        dark = target.closest('section[data-theme="dark"], section[data-theme="black"], section[data-theme="white-bold"]');
        if (dark) {
          const r = dark.getBoundingClientRect();
          dark.style.setProperty("--cursor-light", `radial-gradient(420px circle at ${e.clientX-r.left}px ${e.clientY-r.top}px, #7bbcff20, transparent 75%)`);
        }
        const candidates = document.querySelectorAll<HTMLElement>('.magnetic-cta');
        for (const button of candidates) {
          const r = button.getBoundingClientRect();
          if (e.clientX > r.left-24 && e.clientX < r.right+24 && e.clientY > r.top-24 && e.clientY < r.bottom+24) {
            button.style.translate = `${(e.clientX-r.left-r.width/2)*0.12}px ${(e.clientY-r.top-r.height/2)*0.18}px`;
            previous = button; break;
          }
        }
      });
    };
    const leave = () => { cancelAnimationFrame(frame); reset(); };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    media.addEventListener("change", leave);
    return () => { leave(); window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); media.removeEventListener("change", leave); };
  }, []);
  return <nav aria-label="Page sections" className="chapter-rail">
    {chapters.map(([id, label], i) => <a key={id} href={`#${id}`} aria-label={`${i+1}. ${label}`} aria-current={active === id ? "location" : undefined} className="chapter-dot">
      <span className="chapter-label">{String(i+1).padStart(2,"0")} / {label}</span><span className="chapter-mark" />
    </a>)}
  </nav>;
}
