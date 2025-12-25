import type { ReactNode } from "react";

const Surface = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-ui-border-base bg-ui-bg-component p-4 shadow-xs">
    {children}
  </div>
);

export default Surface;
