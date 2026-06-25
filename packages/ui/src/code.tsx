import { type JSX } from "react";

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code
      className={`bg-neutral-900 text-gray-300 px-1.5 py-0.5 rounded text-sm font-mono ${className || ""}`}
    >
      {children}
    </code>
  );
}
