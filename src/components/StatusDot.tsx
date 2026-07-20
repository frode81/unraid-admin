const TONES = {
  good: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  warn: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  bad: {
    dot: "bg-red-500",
    badge: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  neutral: {
    dot: "bg-gray-400",
    badge: "bg-gray-400/15 text-gray-600 dark:text-gray-400",
  },
} as const;

export type Tone = keyof typeof TONES;

export function StatusDot({ tone = "neutral" }: { tone?: Tone }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${TONES[tone].dot}`} />;
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ${TONES[tone].badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONES[tone].dot}`} />
      {children}
    </span>
  );
}
