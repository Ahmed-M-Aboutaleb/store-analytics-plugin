import type { ReactNode } from "react";

const Surface = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-lg border border-ui-border-base bg-ui-bg-component p-4 shadow-xs ${className}`}
  >
    {children}
  </div>
);

export default Surface;
