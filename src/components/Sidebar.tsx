import type { LucideIcon } from "lucide-react";
import { Bell, Container, Folder, Gauge, Server, Settings as SettingsIcon } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import { useNotifications, useSystemInfo } from "../lib/queries";

export type Page = "dashboard" | "docker" | "vms" | "shares" | "notifications" | "settings";

export function Sidebar({
  current,
  onSelect,
  host,
}: {
  current: Page;
  onSelect: (page: Page) => void;
  host: string;
}) {
  const { t } = useTranslation();
  const { isSuccess, isError } = useSystemInfo();
  const { data: notificationsData } = useNotifications();
  const online = isSuccess && !isError;
  const unreadCount = notificationsData
    ? notificationsData.notifications.overview.unread.alert +
      notificationsData.notifications.overview.unread.warning
    : 0;

  const items: { id: Page; label: string; icon: LucideIcon; color: string; badge?: number }[] = [
    { id: "dashboard", label: t("sidebar.dashboard"), icon: Gauge, color: "bg-[#0A84FF]" },
    { id: "docker", label: t("sidebar.docker"), icon: Container, color: "bg-[#0891B2]" },
    { id: "vms", label: t("sidebar.vms"), icon: Server, color: "bg-[#8B5CF6]" },
    { id: "shares", label: t("sidebar.shares"), icon: Folder, color: "bg-[#22C55E]" },
    {
      id: "notifications",
      label: t("sidebar.notifications"),
      icon: Bell,
      color: "bg-[#F43F5E]",
      badge: unreadCount,
    },
    { id: "settings", label: t("sidebar.settings"), icon: SettingsIcon, color: "bg-[#64748B]" },
  ];

  return (
    <aside
      data-tauri-drag-region
      className="flex h-full w-[var(--sidebar-w)] shrink-0 flex-col gap-0.5 border-r border-black/10 pt-9 pb-3 px-2.5 dark:border-white/10"
    >
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#FF8A3D] to-[#F5701A] shadow-sm">
          <Server size={14} strokeWidth={2.5} className="text-white" />
        </div>
        <span className="text-[15px] font-semibold">Admin for Unraid</span>
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-2.5 rounded-[7px] px-2 py-1.5 text-left text-[13px] transition-colors ${
              active
                ? "bg-[#0A84FF]/15 font-medium text-[#0A84FF] dark:bg-[#0A84FF]/25 dark:text-[#4dabff]"
                : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            }`}
          >
            <span
              className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] shadow-sm ${item.color}`}
            >
              <Icon size={12} strokeWidth={2.5} className="text-white" />
            </span>
            <span className={active ? "" : "opacity-85"}>{item.label}</span>
            {!!item.badge && (
              <span className="ml-auto flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        );
      })}

      <button
        onClick={() => openUrl(`http://${host}/`)}
        title={t("sidebar.openWebUi")}
        className="mt-auto flex items-center gap-2 rounded-[7px] px-2 py-2 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-emerald-500" : isError ? "bg-red-500" : "bg-gray-400"}`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium">{host}</div>
          <div className="text-[10.5px] opacity-55">
            {online ? t("common.online") : isError ? t("common.offline") : t("common.connecting")}
          </div>
        </div>
      </button>
    </aside>
  );
}
