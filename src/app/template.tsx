import { ViewTransition } from "react";

/**
 * Page change: the new page rises from the bottom of the screen over the old one, which settles
 * back and dims. Runs on route changes only (not first load, not search-param or hash changes);
 * the CSS lives in globals.css under "Page transition".
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-rise" exit="page-settle" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
