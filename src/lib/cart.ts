"use client";

import { useSyncExternalStore } from "react";

/*
 * The site cart: a tiny external store shared by the header icon, the cart drawer and any
 * "Shop now" button. Items persist in localStorage (when it's available) so the cart survives
 * reloads; the drawer's open state does not. No checkout exists yet: the drawer hands over to
 * the purchase enquiry.
 */

export type CartItem = {
  id: string;
  name: string;
  /** Short label under the name, e.g. the model's role. */
  note?: string;
  /** USD; null while a price isn't published (shown as "Price on request"). */
  price: number | null;
  image?: string;
  qty: number;
};

type State = { items: CartItem[]; open: boolean };

const KEY = "airguard-cart";
const EMPTY: State = { items: [], open: false };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as CartItem[]) : [];
    if (Array.isArray(items)) state = { ...state, items: items.filter((i) => i && typeof i.id === "string" && i.qty > 0) };
  } catch {
    // storage blocked or corrupt: start empty
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  if (next.items) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state.items));
    } catch {
      // storage blocked: keep the in-memory cart
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  // a stored cart may have loaded after the first (server-matching) render
  if (state.items.length) queueMicrotask(l);
  return () => listeners.delete(l);
}

export const cart = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    load();
    const existing = state.items.find((i) => i.id === item.id);
    const items = existing
      ? state.items.map((i) => (i.id === item.id ? { ...i, ...item, qty: i.qty + qty } : i))
      : [...state.items, { ...item, qty }];
    set({ items, open: true });
  },
  setQty(id: string, qty: number) {
    set({ items: qty > 0 ? state.items.map((i) => (i.id === id ? { ...i, qty } : i)) : state.items.filter((i) => i.id !== id) });
  },
  remove(id: string) {
    set({ items: state.items.filter((i) => i.id !== id) });
  },
  open() {
    load();
    set({ open: true });
  },
  close() {
    set({ open: false });
  },
};

/** The cart's items and open state; empty during server render and hydration. */
export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY
  );
}

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);

/** Sum of priced items, and whether any item still needs a quote. */
export function cartTotal(items: CartItem[]) {
  let total = 0;
  let unpriced = false;
  for (const i of items) {
    if (i.price === null) unpriced = true;
    else total += i.price * i.qty;
  }
  return { total, unpriced };
}

export const formatUsd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
