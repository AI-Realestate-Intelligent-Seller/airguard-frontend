"use client";

import { useCallback, useSyncExternalStore } from "react";
import { PHRASES } from "@/i18n/phrases";
import { LOCALE_KEY } from "@/i18n/script";

/*
 * Site language: English (source), Spanish and Arabic (right to left).
 *
 * The choice lives on the device (localStorage "ag-lang"); a head script applies lang/dir before
 * paint (LOCALE_SCRIPT) so an Arabic page doesn't jump. Text is translated with t("English text"):
 * the English string is the key, so anything not yet translated simply stays in English.
 *
 * Switching goes through `requestLocale`, which the LocaleCurtain plays as a wipe: the new language
 * is committed while the curtain covers the page, then the curtain lifts.
 */

export type Locale = "en" | "es" | "ar";
export const LOCALES: { id: Locale; label: string; short: string; dir: "ltr" | "rtl"; hello: string }[] = [
  { id: "en", label: "English", short: "EN", dir: "ltr", hello: "Welcome" },
  { id: "es", label: "Español", short: "ES", dir: "ltr", hello: "Bienvenido" },
  { id: "ar", label: "العربية", short: "ع", dir: "rtl", hello: "أهلاً بك" },
];
export const localeMeta = (id: Locale) => LOCALES.find((l) => l.id === id)!;

let locale: Locale = "en";
let pending: Locale | null = null;
let ready = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function read(): Locale {
  if (!ready && typeof window !== "undefined") {
    ready = true;
    try {
      const v = localStorage.getItem(LOCALE_KEY);
      if (v === "es" || v === "ar") locale = v;
    } catch {
      /* private mode: English */
    }
  }
  return locale;
}

/** Commit a language now (the curtain calls this while the page is covered). */
export function commitLocale(next: Locale) {
  locale = next;
  pending = null;
  try {
    localStorage.setItem(LOCALE_KEY, next);
  } catch {
    /* not stored: still switches for this visit */
  }
  const root = document.documentElement;
  root.lang = next;
  root.dir = localeMeta(next).dir;
  emit();
}

/** Ask for a language change; the curtain animates it (or it commits at once under reduced motion). */
export function requestLocale(next: Locale) {
  if (next === read() || pending) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return commitLocale(next);
  pending = next;
  emit();
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, read, () => "en");
}
export function usePendingLocale(): Locale | null {
  return useSyncExternalStore(subscribe, () => pending, () => null);
}

/** t("English text"): the text in the current language, falling back to English. `{name}` placeholders are filled from `vars`. */
export function useT() {
  const l = useLocale();
  return useCallback(
    (text: string, vars?: Record<string, string | number>) => {
      let out = l === "en" ? text : (PHRASES[l][text] ?? text);
      if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
      return out;
    },
    [l]
  );
}
