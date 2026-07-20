import { useTranslation } from "react-i18next";
import { useArrayStatus, useDisks, useDockerContainers, useSystemInfo, useVms } from "../lib/queries";
import { MoonStar } from "lucide-react";
import { Badge } from "../components/StatusDot";
import { TopBar } from "../components/TopBar";
import { Meter } from "../components/Meter";
import { Group, GroupLabel } from "../components/GroupedList";
import { formatBitrate, formatBytes, formatKilobytes, formatUptime } from "../lib/format";
import { CARD } from "../lib/ui";
import { ErrorNotice } from "../components/ErrorNotice";
import { TableLoadingRow } from "../components/Loading";
import type { ArrayDiskStatus } from "../lib/types";

function diskTone(status: ArrayDiskStatus | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  if (status === "DISK_OK") return "good";
  if (status === "DISK_NP" || status === "DISK_NEW") return "neutral";
  return "bad";
}

function InlineMeterRow({
  label,
  percent,
  title,
  last,
}: {
  label: string;
  percent: number | null;
  title?: string;
  last?: boolean;
}) {
  return (
    <div
      title={title}
      className={`flex items-center gap-3 px-4 py-2 text-[13px] ${last ? "" : "border-b border-black/5 dark:border-white/5"}`}
    >
      <span className="w-14 shrink-0">{label}</span>
      <div className="flex-1">
        <Meter value={percent ?? 0} />
      </div>
      <span className="w-9 shrink-0 text-right tabular-nums opacity-70">
        {percent == null ? "…" : `${percent.toFixed(0)}%`}
      </span>
    </div>
  );
}

function TextRow({
  label,
  value,
  last,
  tone,
}: {
  label: string;
  value: string;
  last?: boolean;
  tone?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-2 text-[13px] ${last ? "" : "border-b border-black/5 dark:border-white/5"}`}
    >
      <span>{label}</span>
      <span className={`tabular-nums ${tone ?? "opacity-70"}`}>{value}</span>
    </div>
  );
}

export function Dashboard() {
  const { t } = useTranslation();
  const { data: sysData, isLoading: sysLoading, error: sysError } = useSystemInfo();
  const { data: arrData, isLoading: arrLoading, error: arrError } = useArrayStatus();
  const { data: disksData } = useDisks();
  const { data: dockerData } = useDockerContainers();
  const { data: vmData } = useVms();

  const info = sysData?.info;
  const metrics = sysData?.metrics;
  const array = arrData?.array;

  const arrayUsed = array ? Number(array.capacity.kilobytes.used) : null;
  const arrayTotal = array ? Number(array.capacity.kilobytes.total) : null;
  const arrayPercent =
    arrayUsed != null && arrayTotal ? (arrayUsed / arrayTotal) * 100 : null;

  const containers = dockerData?.docker.containers ?? [];
  const containersRunning = containers.filter((c) => c.state === "RUNNING").length;
  const domains = vmData?.vms.domains ?? [];
  const vmsRunning = domains.filter((d) => d.state === "RUNNING").length;

  const totalRx = metrics?.network.reduce((sum, n) => sum + n.rxSec, 0) ?? null;
  const totalTx = metrics?.network.reduce((sum, n) => sum + n.txSec, 0) ?? null;

  const tempSummary = metrics?.temperature?.summary;
  const tempIssues = (tempSummary?.warningCount ?? 0) + (tempSummary?.criticalCount ?? 0);

  const disks = [...(array?.parities ?? []), ...(array?.disks ?? []), ...(array?.caches ?? [])];
  const smartByDevice = new Map((disksData?.disks ?? []).map((d) => [d.device, d]));

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t("dashboard.title")} />
      <div className="flex-1 overflow-y-auto px-6 pb-4 pt-4">
        {(sysError || arrError) && <ErrorNotice error={sysError ?? arrError} />}

        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 ${CARD}`}>
            <div className="text-[10.5px] uppercase tracking-wide opacity-50">{t("dashboard.docker")}</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={containersRunning > 0 ? "good" : "neutral"}>
                {t("dashboard.running", { count: containersRunning })}
              </Badge>
              <span className="text-[11px] opacity-50">
                {t("dashboard.ofTotal", { count: containers.length })}
              </span>
            </div>
          </div>
          <div className={`p-3 ${CARD}`}>
            <div className="text-[10.5px] uppercase tracking-wide opacity-50">{t("dashboard.vms")}</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={vmsRunning > 0 ? "good" : "neutral"}>
                {t("dashboard.running", { count: vmsRunning })}
              </Badge>
              <span className="text-[11px] opacity-50">
                {t("dashboard.ofTotal", { count: domains.length })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <GroupLabel>{t("dashboard.server")}</GroupLabel>
          <div className={`grid grid-cols-2 gap-x-4 gap-y-1.5 p-4 text-[13px] ${CARD}`}>
            <div className="flex justify-between">
              <span className="opacity-70">{t("dashboard.version")}</span>
              <span>{info?.versions?.core.unraid ?? "–"}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">{t("dashboard.host")}</span>
              <span>{info?.os.hostname ?? "–"}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">{t("dashboard.platform")}</span>
              <span>
                {info?.os.distro ? `${info.os.distro}${info.os.release ? ` ${info.os.release}` : ""}` : "–"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">{t("dashboard.kernel")}</span>
              <span>{info?.os.kernel ?? "–"}</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <GroupLabel>{t("dashboard.systemStatus")}</GroupLabel>
          <Group>
            <InlineMeterRow
              label={t("dashboard.cpu")}
              percent={sysLoading ? null : (metrics?.cpu?.percentTotal ?? 0)}
              title={info?.cpu?.brand ?? undefined}
            />
            <InlineMeterRow
              label={t("dashboard.memory")}
              percent={sysLoading ? null : (metrics?.memory?.percentTotal ?? 0)}
              title={
                metrics?.memory
                  ? `${formatBytes(metrics.memory.used)} ${t("dashboard.of")} ${formatBytes(metrics.memory.total)}`
                  : undefined
              }
            />
            <InlineMeterRow
              label={t("dashboard.array")}
              percent={arrLoading ? null : arrayPercent}
              title={
                array
                  ? `${formatKilobytes(array.capacity.kilobytes.used)} ${t("dashboard.of")} ${formatKilobytes(array.capacity.kilobytes.total)}`
                  : undefined
              }
            />
            <TextRow
              label={t("dashboard.network")}
              value={`↓ ${formatBitrate(totalRx)} ↑ ${formatBitrate(totalTx)}`}
            />
            <TextRow
              label={t("dashboard.temperature")}
              value={
                tempSummary
                  ? `${tempSummary.hottest.current.value.toFixed(0)}° ${tempSummary.hottest.name}`
                  : "–"
              }
              tone={tempIssues > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
            />
            <TextRow label={t("dashboard.uptime")} value={formatUptime(info?.os.uptime)} last />
          </Group>
        </div>

        <div className="mt-4">
          <GroupLabel>{t("dashboard.disks")}</GroupLabel>
          <div className={`overflow-hidden ${CARD}`}>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead className="sticky top-0 bg-[#f7f7f7] text-[11px] uppercase tracking-wide opacity-55 dark:bg-[#333]">
                  <tr>
                    <th className="px-3 py-1.5 font-medium">{t("common.name")}</th>
                    <th className="px-3 py-1.5 font-medium">{t("dashboard.status")}</th>
                    <th className="px-3 py-1.5 font-medium">{t("dashboard.interface")}</th>
                    <th className="px-3 py-1.5 font-medium">{t("dashboard.temp")}</th>
                    <th className="px-3 py-1.5 font-medium">{t("dashboard.usage")}</th>
                  </tr>
                </thead>
                <tbody>
                  {disks.map((disk) => {
                    const used = disk.fsUsed ? Number(disk.fsUsed) : null;
                    const total = disk.fsSize ? Number(disk.fsSize) : null;
                    const pct = used != null && total ? (used / total) * 100 : null;
                    const smart = disk.device ? smartByDevice.get(disk.device) : undefined;
                    return (
                      <tr key={disk.id} className="border-t border-black/5 dark:border-white/5">
                        <td className="px-3 py-1">{disk.name ?? disk.device ?? disk.id}</td>
                        <td className="px-3 py-1">
                          <Badge tone={diskTone(disk.status)}>{disk.status ?? "–"}</Badge>
                        </td>
                        <td className="px-3 py-1">
                          {smart ? (
                            <span className="inline-flex items-center gap-1 opacity-70">
                              {smart.interfaceType}
                              {!smart.isSpinning && (
                                <span title={t("dashboard.spunDown")}>
                                  <MoonStar size={11} className="opacity-60" />
                                </span>
                              )}
                            </span>
                          ) : (
                            "–"
                          )}
                        </td>
                        <td className="px-3 py-1 tabular-nums">
                          {disk.temp != null ? `${disk.temp}°C` : "–"}
                        </td>
                        <td className="px-3 py-1">
                          {pct != null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16">
                                <Meter value={pct} size="sm" />
                              </div>
                              <span className="tabular-nums opacity-70">
                                {formatBytes(disk.fsUsed)} / {formatBytes(disk.fsSize)}
                              </span>
                            </div>
                          ) : (
                            "–"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {arrLoading && <TableLoadingRow colSpan={5} />}
                  {!arrLoading && disks.length === 0 && (
                    <tr>
                      <td className="px-3 py-3 opacity-50" colSpan={5}>
                        {t("dashboard.noDisks")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
