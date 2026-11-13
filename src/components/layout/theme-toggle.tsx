"use client";

import { Moon, Sun } from "lucide-react";
import { isDarkTheme as isDark, useIsDark } from "@/hooks/use-is-dark";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "@/lib/theme";

/*
 * Light / dark switch. The theme is a `dark` class on <html>: an inline script in
 * the root layout (THEME_SCRIPT, in lib/theme) applies the saved choice, or the system setting,
 * before first paint; this button flips it and remembers the choice.
 */

export function ThemeToggle({ className }: { className?: string }) {
  const dark = useIsDark();

  const toggle = () => {
    const next = !isDark();
    const root = document.documentElement;
    // Swap colours in one go rather than letting every transition animate.
    root.classList.add("theme-switching");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private mode or blocked storage: the switch still works for this visit.
    }
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-full text-navy/80 transition-colors hover:bg-brand-50 hover:text-brand-500",
        className
      )}
    >
      <Sun
        className={cn(
          "absolute size-[18px] transition-all duration-300",
          dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "absolute size-[18px] transition-all duration-300",
          dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )}
      />
    </button>
  );
}
