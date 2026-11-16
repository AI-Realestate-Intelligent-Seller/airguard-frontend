import { cart, type CartItem } from "@/lib/cart";

/*
 * "Added to cart" in motion: the product's picture lifts off the button that was pressed, arcs up
 * to the cart icon in the header, the icon bumps, and then the cart drawer opens. Without a
 * visible cart icon, or under reduced motion, the item is simply added and the drawer opens.
 */
const FLIGHT_MS = 750;

export function flyToCart(item: Omit<CartItem, "qty">, from: Element | null) {
  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!from || !target || reduce || !item.image) {
    cart.add(item);
    return;
  }

  cart.add(item, 1, { open: false });

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 64;
  const x0 = a.left + a.width / 2 - size / 2, y0 = a.top + a.height / 2 - size / 2;
  const x1 = b.left + b.width / 2 - size / 2, y1 = b.top + b.height / 2 - size / 2;
  // a gentle arc: the midpoint rides above the straight line
  const xm = (x0 + x1) / 2, ym = Math.min(y0, y1) - 90;

  const img = document.createElement("img");
  img.src = item.image;
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  Object.assign(img.style, {
    position: "fixed", left: "0", top: "0", width: `${size}px`, height: `${size}px`, zIndex: "120",
    objectFit: "contain", background: "#fff", borderRadius: "16px", padding: "6px", pointerEvents: "none",
    boxShadow: "0 18px 40px -16px rgba(23,34,54,.55)",
  });
  document.body.appendChild(img);

  const flight = img.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
      { transform: `translate(${xm}px, ${ym}px) scale(.8)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1}px, ${y1}px) scale(.25)`, opacity: 0.6 },
    ],
    { duration: FLIGHT_MS, easing: "cubic-bezier(.45, 0, .25, 1)" }
  );
  flight.onfinish = flight.oncancel = () => {
    img.remove();
    target.dataset.bump = "1";
    window.setTimeout(() => {
      delete target.dataset.bump;
      cart.open();
    }, 450);
  };
}
