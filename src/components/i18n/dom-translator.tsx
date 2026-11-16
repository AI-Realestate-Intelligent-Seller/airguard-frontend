"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n/locale";
import { PHRASES } from "@/i18n/phrases";
import { PAGE_PHRASES } from "@/i18n/phrases-pages";

/*
 * Translates page copy in place. Components keep their English source; when the language is
 * Spanish or Arabic, every text node, and the aria-label / placeholder / alt / title attributes,
 * whose English wording is in the phrase lists is swapped for its translation. The English is
 * remembered per node, so switching back restores it exactly. A MutationObserver translates
 * whatever React renders later (scroll sections, menus, dialogs). Anything inside
 * [data-no-translate] is left alone.
 */

const ATTRS = ["aria-label", "placeholder", "alt", "title"] as const;
type Seen = { en: string; shown: string };
const texts = new WeakMap<Text, Seen>();
const attrs = new WeakMap<Element, Record<string, Seen>>();
/** Set once the first page has finished hydrating; client navigations after that are safe at once. */
let hydrated = false;

export function DomTranslator() {
  const locale = useLocale();

  useEffect(() => {
    const dict = locale === "en" ? null : { ...PHRASES[locale], ...PAGE_PHRASES[locale] };
    const translate = (en: string) => {
      if (!dict) return en;
      const m = en.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
      const key = m[2].replace(/\s+/g, " ");
      const hit = key ? dict[key] : undefined;
      // an empty translation is allowed: a word some languages drop (Arabic has no "A")
      return hit !== undefined ? m[1] + hit + m[3] : en;
    };
    const skip = (el: Element | null) => !el || !!el.closest("script,style,noscript,[data-no-translate]");

    const doText = (n: Text) => {
      if (skip(n.parentElement)) return;
      const cur = n.nodeValue ?? "";
      let seen = texts.get(n);
      // anything other than what we last showed is fresh English from React
      if (!seen || cur !== seen.shown) seen = { en: cur, shown: cur };
      const next = translate(seen.en);
      if (next !== cur) n.nodeValue = next;
      texts.set(n, { en: seen.en, shown: next });
    };
    const doAttrs = (el: Element) => {
      if (skip(el)) return;
      let rec = attrs.get(el);
      for (const a of ATTRS) {
        const cur = el.getAttribute(a);
        if (cur === null) continue;
        rec ??= {};
        let seen = rec[a];
        if (!seen || cur !== seen.shown) seen = { en: cur, shown: cur };
        const next = translate(seen.en);
        if (next !== cur) el.setAttribute(a, next);
        rec[a] = { en: seen.en, shown: next };
      }
      if (rec) attrs.set(el, rec);
    };
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return doText(root as Text);
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      doAttrs(root as Element);
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (n.nodeType === Node.TEXT_NODE) doText(n as Text);
        else doAttrs(n as Element);
      }
    };

    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") doText(m.target as Text);
        else if (m.type === "attributes") doAttrs(m.target as Element);
        else m.addedNodes.forEach(walk);
      }
    });
    const start = () => {
      walk(document.body);
      mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    };
    // On a fresh page React is still hydrating the server HTML: changing it now would make React
    // throw it away. Wait until the page has loaded and the browser is idle; later switches run at once.
    let cancel = () => {};
    if (hydrated) start();
    else {
      const go = () => {
        const id = requestIdleCallback(() => {
          hydrated = true;
          start();
        }, { timeout: 1200 });
        cancel = () => cancelIdleCallback(id);
      };
      if (document.readyState === "complete") go();
      else {
        window.addEventListener("load", go, { once: true });
        cancel = () => window.removeEventListener("load", go);
      }
    }
    return () => {
      cancel();
      mo.disconnect();
    };
  }, [locale]);

  return null;
}
