import { cn } from "@/lib/utils";
import type { ReactNode, Ref, ComponentPropsWithoutRef } from "react";

export type SectionTheme =
  | "white"
  | "white-bold"
  | "light"
  | "bright"
  | "dark"
  | "black";

/**
 * Applies one of AirGuard's 10 section themes (see ui-kit/tokens.json) via
 * a data-theme attribute. Child components read --section-bg / --section-heading /
 * --section-text / --section-btn-bg / --section-btn-fg instead of hardcoding colors.
 */
export function Section({
  children,
  theme = "white",
  className,
  id,
  ref,
  onMouseEnter,
  onMouseLeave,
  ...props
}: {
  children: ReactNode;
  theme?: SectionTheme;
  className?: string;
  id?: string;
  ref?: Ref<HTMLElement>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
} & ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...props}
      ref={ref}
      id={id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-theme={theme}
      className={cn(
        "bg-[var(--section-bg)] text-[var(--section-text)] py-16 md:py-24 lg:py-[8vw]",
        className
      )}
    >
      {children}
    </section>
  );
}
