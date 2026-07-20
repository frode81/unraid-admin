import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Copyable({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={t("common.clickToCopy")}
      className={`group inline-flex items-center gap-1 rounded hover:bg-black/[0.05] dark:hover:bg-white/[0.08] ${className}`}
    >
      <span>{value}</span>
      {copied ? (
        <Check size={10} className="shrink-0 text-emerald-500" />
      ) : (
        <Copy size={10} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-40" />
      )}
    </button>
  );
}
