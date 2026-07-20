import i18n from "../i18n";

export function formatBytes(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  const bytes = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatKilobytes(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  const kb = typeof value === "string" ? Number(value) : value;
  return formatBytes(kb * 1024);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return `${value.toFixed(0)}%`;
}

/** The API returns the boot timestamp (not a duration) for `os.uptime`. */
export function formatUptime(value: string | null | undefined): string {
  if (!value) return "–";
  const bootedAt = new Date(value);
  if (Number.isNaN(bootedAt.getTime())) return value;

  const diffMs = Date.now() - bootedAt.getTime();
  if (diffMs < 0) return "–";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(i18n.t("time.days", { count: days }));
  if (days > 0 || hours > 0) parts.push(i18n.t("time.hours", { count: hours }));
  parts.push(i18n.t("time.minutes", { count: minutes }));
  return parts.join(" ");
}

/** `created` is a unix timestamp (seconds). */
export function formatRelativeDate(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return "–";
  const diffMs = Date.now() - unixSeconds * 1000;
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays <= 0) return i18n.t("time.today");
  if (diffDays === 1) return i18n.t("time.yesterday");
  if (diffDays < 30) return i18n.t("time.daysAgo", { count: diffDays });
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return i18n.t("time.monthsAgo", { count: diffMonths });
  return i18n.t("time.yearsAgo", { count: Math.floor(diffMonths / 12) });
}

export function formatPort(port: { ip: string | null; privatePort: number | null; publicPort: number | null; type: string }): string {
  const proto = port.type.toLowerCase();
  if (port.publicPort) return `${port.publicPort}:${port.privatePort ?? "?"}/${proto}`;
  return `${port.privatePort ?? "?"}/${proto}`;
}

/** `bytesPerSec` from the API's `rxSec`/`txSec` fields. */
export function formatBitrate(bytesPerSec: number | null | undefined): string {
  if (bytesPerSec == null || !Number.isFinite(bytesPerSec)) return "–";
  return `${formatBytes(bytesPerSec)}/s`;
}
