export function meterTone(percent: number): string {
  if (percent >= 90) return "#FF3B30";
  if (percent >= 70) return "#FF9F0A";
  return "#0A84FF";
}

export function Meter({
  value,
  color,
  size = "md",
}: {
  value: number;
  color?: string;
  size?: "sm" | "md";
}) {
  const pct = Math.max(0, Math.min(100, value));
  const tone = color ?? meterTone(pct);
  const height = size === "sm" ? "h-[4px]" : "h-[6px]";
  return (
    <div className={`w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15 ${height}`}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, backgroundColor: tone }}
      />
    </div>
  );
}
