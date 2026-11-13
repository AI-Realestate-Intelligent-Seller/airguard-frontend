"use client";

import { Plus, ShoppingCart } from "lucide-react";
import { modelById, type ModelId } from "@/data/airguard-models";
import { cart } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * "Shop now": adds one AirGuard model to the cart, which slides open. `variant="icon"` is the
 * compact round "+ cart" button (used beside the model name on phones).
 */
export function AddToCart({
  id,
  className,
  onAdd,
  variant = "button",
}: {
  id: ModelId;
  className?: string;
  onAdd?: () => void;
  variant?: "button" | "icon";
}) {
  const m = modelById[id];
  const add = () => {
    onAdd?.();
    cart.add({ id: `airguard-${m.id}`, name: m.name, note: m.role, price: m.price, image: m.image.src });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={add}
        aria-label={`Add ${m.name} to cart`}
        title="Add to cart"
        className={cn(
          "inline-flex h-10 shrink-0 items-center justify-center gap-0.5 rounded-full bg-brand-500 px-3 text-white shadow-[0_10px_24px_-12px_rgba(64,103,177,0.85)] transition-colors hover:bg-brand-600 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
          className
        )}
      >
        <Plus className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
        <ShoppingCart className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      className={cn(
        "magnetic-cta inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-sm font-medium text-white shadow-[0_14px_30px_-14px_rgba(64,103,177,0.8)] hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
        className
      )}
    >
      <ShoppingCart className="size-4" aria-hidden="true" />
      Shop now
    </button>
  );
}
