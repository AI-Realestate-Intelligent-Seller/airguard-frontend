import { cn } from "@/lib/utils";

/**
 * Placeholder while a 3D model loads: a soft product-shaped block and its floor shadow, with a
 * light sweeping across (still under reduced motion). On failure it says so instead.
 */
export function ModelSkeleton({ failed = false, className }: { failed?: boolean; className?: string }) {
  if (failed) {
    return (
      <div className={cn("pointer-events-none absolute inset-0 grid place-items-center", className)}>
        <p className="text-sm text-navy/60 dark:text-white/60">The 3D view couldn&apos;t load in this browser.</p>
      </div>
    );
  }
  return (
    <div role="status" className={cn("pointer-events-none absolute inset-0 grid place-items-center", className)}>
      <span className="sr-only">Loading the 3D model</span>
      <div aria-hidden="true" className="relative flex w-[56%] max-w-[420px] flex-col items-center">
        <div className="skeleton-shimmer aspect-[4/3] w-full rounded-[28px]" />
        <div className="skeleton-shimmer mt-4 h-4 w-[80%] rounded-[50%] opacity-70" />
      </div>
    </div>
  );
}
