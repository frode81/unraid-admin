import type { ReactNode } from "react";

export function MiniCard({
  icon: Icon,
  title,
  trailing,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide opacity-50">
          <Icon size={11} />
          {title}
        </div>
        {trailing && <div className="text-[11px] opacity-50">{trailing}</div>}
      </div>
      {children}
    </div>
  );
}
