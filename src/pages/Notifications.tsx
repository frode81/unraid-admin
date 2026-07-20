import { AlertTriangle, Info, TriangleAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useArchiveNotification, useNotifications } from "../lib/queries";
import { Badge } from "../components/StatusDot";
import { TopBar } from "../components/TopBar";
import { GroupLabel } from "../components/GroupedList";
import { CARD } from "../lib/ui";
import { ErrorNotice } from "../components/ErrorNotice";
import { LoadingBlock } from "../components/Loading";
import type { NotificationImportance } from "../lib/types";

function ImportanceIcon({ importance }: { importance: NotificationImportance }) {
  if (importance === "ALERT") return <TriangleAlert size={15} className="text-red-500" />;
  if (importance === "WARNING") return <AlertTriangle size={15} className="text-amber-500" />;
  return <Info size={15} className="text-gray-400" />;
}

export function Notifications() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useNotifications();
  const archive = useArchiveNotification();

  const items = data?.notifications.warningsAndAlerts ?? [];
  const overview = data?.notifications.overview;

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t("notifications.title")} />
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
        {error && <ErrorNotice error={error} />}

        <div className="mb-2 flex items-center justify-between">
          <GroupLabel>{t("notifications.title")}</GroupLabel>
          {overview && (overview.unread.alert > 0 || overview.unread.warning > 0) && (
            <div className="flex items-center gap-1.5 pb-1.5">
              {overview.unread.alert > 0 && (
                <Badge tone="bad">{t("notifications.alerts", { count: overview.unread.alert })}</Badge>
              )}
              {overview.unread.warning > 0 && (
                <Badge tone="warn">
                  {t("notifications.warnings", { count: overview.unread.warning })}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className={`overflow-hidden ${CARD}`}>
          {items.map((n, i) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 text-[12.5px] ${
                i > 0 ? "border-t border-black/5 dark:border-white/5" : ""
              }`}
            >
              <span className="mt-0.5 shrink-0">
                <ImportanceIcon importance={n.importance} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{n.subject}</span>
                  <span className="shrink-0 text-[11px] opacity-45">{n.formattedTimestamp}</span>
                </div>
                <div className="mt-0.5 opacity-70">{n.description}</div>
              </div>
              <button
                onClick={() => archive.mutate(n.id)}
                title={t("notifications.dismiss")}
                className="mt-0.5 shrink-0 rounded-md p-1 opacity-40 hover:bg-black/[0.06] hover:opacity-90 dark:hover:bg-white/[0.08]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {isLoading && <LoadingBlock />}
          {!isLoading && items.length === 0 && (
            <div className="px-4 py-6 text-center text-[12.5px] opacity-50">
              {t("notifications.none")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
