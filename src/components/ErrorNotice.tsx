import { AlertTriangle, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function ErrorNotice({ error, className }: { error: unknown; className?: string }) {
  const { t } = useTranslation();
  const message = errorMessage(error);
  const offline = message.includes("Could not reach the server");

  return (
    <div
      className={`mb-3 flex items-start gap-2.5 rounded-md bg-red-500/10 px-3 py-2.5 text-red-600 dark:text-red-400 ${className ?? ""}`}
    >
      {offline ? (
        <WifiOff size={15} className="mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium">
          {offline ? t("common.offlineTitle") : t("common.errorTitle")}
        </div>
        <div className="text-[11.5px] opacity-80">{offline ? t("common.offlineBody") : message}</div>
      </div>
    </div>
  );
}
