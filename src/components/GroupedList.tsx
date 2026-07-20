import type { ReactNode } from "react";
import { CARD } from "../lib/ui";

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide opacity-50">
      {children}
    </div>
  );
}

export function Group({ children }: { children: ReactNode }) {
  return <div className={`overflow-hidden ${CARD}`}>{children}</div>;
}

export function Row({
  label,
  children,
  last,
  muted = true,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 text-[13px] ${
        last ? "" : "border-b border-black/5 dark:border-white/5"
      }`}
    >
      <span>{label}</span>
      <span className={muted ? "opacity-60" : ""}>{children}</span>
    </div>
  );
}
