import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, FolderOpen, HardDrive, Lock, Settings2 } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useShares } from "../lib/queries";
import { Badge } from "../components/StatusDot";
import { MiniCard } from "../components/MiniCard";
import { TopBar } from "../components/TopBar";
import { Meter } from "../components/Meter";
import { GroupLabel } from "../components/GroupedList";
import { formatKilobytes } from "../lib/format";
import { CARD } from "../lib/ui";
import { ErrorNotice } from "../components/ErrorNotice";
import { TableLoadingRow } from "../components/Loading";
import type { Share } from "../lib/types";

function isEncrypted(luksStatus: string | null): boolean {
  return !!luksStatus && luksStatus.toUpperCase() !== "NONE" && luksStatus.toUpperCase() !== "UNENCRYPTED";
}

function healthTone(color: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!color) return "neutral";
  const c = color.toLowerCase();
  if (c.includes("red")) return "bad";
  if (c.includes("yellow") || c.includes("orange")) return "warn";
  if (c.includes("green")) return "good";
  return "neutral";
}

function ShareDetails({ share }: { share: Share }) {
  const { t } = useTranslation();
  const hasDiskInfo =
    (share.include && share.include.length > 0) || (share.exclude && share.exclude.length > 0);
  const hasSettings = share.allocator || share.splitLevel || share.floor || share.cow;

  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-3">
      {hasDiskInfo && (
        <MiniCard icon={HardDrive} title={t("shares.disks")}>
          <div className="space-y-2 text-[12px]">
            {share.include && share.include.length > 0 && (
              <div>
                <div className="opacity-50">{t("shares.included")}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {share.include.map((disk) => (
                    <span
                      key={disk}
                      className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.1]"
                    >
                      {disk}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {share.exclude && share.exclude.length > 0 && (
              <div>
                <div className="opacity-50">{t("shares.excluded")}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {share.exclude.map((disk) => (
                    <span
                      key={disk}
                      className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.1]"
                    >
                      {disk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </MiniCard>
      )}

      {hasSettings && (
        <MiniCard icon={Settings2} title={t("shares.settings")}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
            {share.allocator && (
              <div>
                <div className="opacity-50">{t("shares.allocator")}</div>
                <div className="mt-0.5">{share.allocator}</div>
              </div>
            )}
            {share.splitLevel && (
              <div>
                <div className="opacity-50">{t("shares.splitLevel")}</div>
                <div className="mt-0.5">{share.splitLevel}</div>
              </div>
            )}
            {share.floor && (
              <div>
                <div className="opacity-50">{t("shares.floor")}</div>
                <div className="mt-0.5">{formatKilobytes(share.floor)}</div>
              </div>
            )}
            {share.cow && (
              <div>
                <div className="opacity-50">{t("shares.cow")}</div>
                <div className="mt-0.5">{share.cow}</div>
              </div>
            )}
          </div>
        </MiniCard>
      )}
    </div>
  );
}

export function Shares({ host }: { host: string }) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useShares();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const shares = data?.shares ?? [];

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t("shares.title")} />
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
        {error && <ErrorNotice error={error} />}

        <GroupLabel>{t("shares.title")}</GroupLabel>
        <div className={`overflow-hidden ${CARD}`}>
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-black/[0.03] text-[11px] uppercase tracking-wide opacity-55 dark:bg-white/[0.06]">
              <tr>
                <th className="w-7 px-3 py-2" />
                <th className="px-3 py-2 font-medium">{t("common.name")}</th>
                <th className="px-3 py-2 font-medium">{t("shares.usage")}</th>
                <th className="px-3 py-2 font-medium">{t("shares.cache")}</th>
                <th className="px-3 py-2 font-medium">{t("shares.health")}</th>
                <th className="px-3 py-2 font-medium">{t("shares.comment")}</th>
                <th className="px-3 py-2 font-medium text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => {
                const used = share.used != null ? Number(share.used) : null;
                const total = share.size != null ? Number(share.size) : null;
                const pct = used != null && total != null && total > 0 ? (used / total) * 100 : null;
                const isOpen = expanded.has(share.id);
                const hasDetails =
                  (share.include && share.include.length > 0) ||
                  (share.exclude && share.exclude.length > 0) ||
                  !!(share.allocator || share.splitLevel || share.floor || share.cow);
                return (
                  <Fragment key={share.id}>
                    <tr
                      onClick={() => hasDetails && toggle(share.id)}
                      className={`border-t border-black/5 dark:border-white/5 ${
                        hasDetails ? "cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]" : ""
                      }`}
                    >
                      <td className="px-3 py-1.5">
                        {hasDetails && (
                          <ChevronRight
                            size={13}
                            className={`opacity-50 transition-transform ${isOpen ? "rotate-90" : ""}`}
                          />
                        )}
                      </td>
                      <td
                        className="max-w-0 truncate px-3 py-1.5 font-medium"
                        title={share.name ?? undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          {share.name ?? "–"}
                          {isEncrypted(share.luksStatus) && (
                            <Lock size={11} className="shrink-0 opacity-50" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        {pct != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20">
                              <Meter value={pct} size="sm" />
                            </div>
                            <span className="tabular-nums opacity-70">
                              {formatKilobytes(share.used)} / {formatKilobytes(share.size)}
                            </span>
                          </div>
                        ) : used != null && used > 0 ? (
                          <span className="tabular-nums opacity-70">{formatKilobytes(share.used)}</span>
                        ) : (
                          <span className="opacity-50">–</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {share.cache ? (
                          <Badge tone="good">{t("shares.cacheYes")}</Badge>
                        ) : (
                          <span className="opacity-40">–</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {share.color ? (
                          <Badge tone={healthTone(share.color)}>{share.color}</Badge>
                        ) : (
                          <span className="opacity-40">–</span>
                        )}
                      </td>
                      <td
                        className="max-w-0 truncate px-3 py-1.5 opacity-70"
                        title={share.comment ?? undefined}
                      >
                        {share.comment || "–"}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          {share.name && (
                            <button
                              onClick={() => openUrl(`smb://${host}/${encodeURIComponent(share.name!)}`)}
                              className="rounded-md p-1.5 text-[#0A84FF] hover:bg-[#0A84FF]/10"
                              title={t("shares.connect")}
                            >
                              <FolderOpen size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t border-black/5 bg-black/[0.03] dark:border-white/5 dark:bg-white/[0.05]">
                        <td colSpan={7}>
                          <ShareDetails share={share} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {isLoading && <TableLoadingRow colSpan={7} />}
              {!isLoading && shares.length === 0 && (
                <tr>
                  <td className="px-3 py-3 opacity-50" colSpan={7}>
                    {t("shares.noShares")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
