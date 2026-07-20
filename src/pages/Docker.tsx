import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Container as ContainerIcon,
  ExternalLink,
  HardDrive,
  Loader2,
  Network,
  Pause,
  Play,
  RotateCw,
  Search,
  Sparkles,
  Square,
  Terminal,
  Trash2,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import { Copyable } from "../components/Copyable";
import { ErrorNotice } from "../components/ErrorNotice";
import { TableLoadingRow } from "../components/Loading";
import { MiniCard } from "../components/MiniCard";
import {
  useDockerAction,
  useDockerAutostart,
  useDockerContainers,
  useDockerRemove,
  useDockerUpdate,
} from "../lib/queries";
import { useDockerStats } from "../lib/useDockerStats";
import { Badge } from "../components/StatusDot";
import { TopBar } from "../components/TopBar";
import { Meter } from "../components/Meter";
import { Toggle } from "../components/Native";
import { GroupLabel } from "../components/GroupedList";
import { formatPort, formatRelativeDate } from "../lib/format";
import { parseContainerNetwork, parseMounts } from "../lib/docker-parse";
import { CARD } from "../lib/ui";
import type { ContainerState, DockerContainer, DockerContainerStats } from "../lib/types";

function tone(state: ContainerState): "good" | "warn" | "neutral" {
  if (state === "RUNNING") return "good";
  if (state === "PAUSED") return "warn";
  return "neutral";
}

function StatBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-2.5 text-[12px] dark:border-white/10 dark:bg-white/[0.06]">
      <div className="opacity-50">{label}</div>
      {children}
    </div>
  );
}

function ContainerDetails({
  container,
  stats,
}: {
  container: DockerContainer;
  stats: DockerContainerStats | undefined;
}) {
  const { t } = useTranslation();
  const update = useDockerUpdate();
  const remove = useDockerRemove();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [withImage, setWithImage] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  function handleUpdate() {
    update.mutate(container.id, {
      onSuccess: () => {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 4000);
      },
    });
  }

  const links = [
    { label: t("docker.project"), url: container.projectUrl },
    { label: t("docker.support"), url: container.supportUrl },
    { label: t("docker.registry"), url: container.registryUrl },
  ].filter((l) => l.url);

  const network = parseContainerNetwork(container.networkSettings);
  const mounts = parseMounts(container.mounts);
  const sortedLanIpPorts = container.lanIpPorts ? [...container.lanIpPorts].sort() : [];
  const sortedPorts = [...container.ports].sort(
    (a, b) => (a.privatePort ?? 0) - (b.privatePort ?? 0),
  );

  return (
    <div className="space-y-3 px-4 py-3">
      {(container.isUpdateAvailable || justUpdated) && (
        <div
          className={`flex items-center justify-between rounded-lg px-3 py-2 ${
            justUpdated ? "bg-emerald-500/10" : "bg-[#0A84FF]/10"
          }`}
        >
          {justUpdated ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              {t("docker.updated")}
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#0A84FF]">
                <Sparkles size={13} />
                {t("docker.updateAvailable")}
              </span>
              <button
                disabled={update.isPending}
                onClick={handleUpdate}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0A84FF] px-2.5 py-1 text-[11.5px] font-medium text-white disabled:opacity-70"
              >
                {update.isPending && <Loader2 size={12} className="animate-spin" />}
                {update.isPending ? t("docker.updating") : t("docker.update")}
              </button>
            </>
          )}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <StatBox label={t("dashboard.cpu")}>
            <div className="mt-1 flex items-center justify-between">
              <div className="mr-2 flex-1">
                <Meter value={stats.cpuPercent} size="sm" />
              </div>
              <span className="tabular-nums">{stats.cpuPercent.toFixed(1)}%</span>
            </div>
          </StatBox>
          <StatBox label={t("dashboard.memory")}>
            <div className="mt-1 flex items-center justify-between">
              <div className="mr-2 flex-1">
                <Meter value={stats.memPercent} size="sm" />
              </div>
              <span className="tabular-nums">{stats.memPercent.toFixed(1)}%</span>
            </div>
            <div className="mt-1 text-[10.5px] opacity-60">{stats.memUsage}</div>
          </StatBox>
          <StatBox label={t("docker.networkIO")}>
            <div className="mt-1">{stats.netIO}</div>
          </StatBox>
          <StatBox label={t("docker.diskIO")}>
            <div className="mt-1">{stats.blockIO}</div>
          </StatBox>
        </div>
      )}

      <div className={mounts.length > 0 ? "grid grid-cols-2 gap-3" : ""}>
        <MiniCard
          icon={Network}
          title={t("docker.network")}
          trailing={
            <span className="inline-flex items-center gap-1">
              <Clock size={10} />
              {formatRelativeDate(container.created)}
            </span>
          }
        >
          <div className="space-y-1.5 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="opacity-50">{t("docker.containerIp")}</span>
              {network.ip ? (
                <Copyable value={network.ip} className="font-mono text-[11px]" />
              ) : (
                <span className="opacity-50">–</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-50">{t("docker.macAddress")}</span>
              {network.mac ? (
                <Copyable value={network.mac} className="font-mono text-[11px]" />
              ) : (
                <span className="opacity-50">–</span>
              )}
            </div>
          </div>
          {sortedLanIpPorts.length + sortedPorts.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-black/5 pt-2.5 dark:border-white/10">
              {sortedLanIpPorts.map((entry) => (
                <Copyable
                  key={`lan-${entry}`}
                  value={entry}
                  className="bg-black/[0.05] px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.1]"
                />
              ))}
              {sortedPorts.map((p, i) => (
                <Copyable
                  key={`port-${p.privatePort}-${p.type}-${i}`}
                  value={formatPort(p)}
                  className="bg-black/[0.05] px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.1]"
                />
              ))}
            </div>
          )}
        </MiniCard>

        {mounts.length > 0 && (
          <MiniCard icon={HardDrive} title={t("docker.volumes")}>
            <div className="space-y-2 text-[11px] font-mono">
              {mounts.map((m) => (
                <div key={m.destination}>
                  <div className="truncate opacity-60" title={m.source}>
                    {m.source}
                  </div>
                  <div className="truncate">
                    <span className="opacity-40">→ </span>
                    {m.destination}
                    {m.mode && <span className="opacity-50"> ({m.mode})</span>}
                  </div>
                </div>
              ))}
            </div>
          </MiniCard>
        )}
      </div>

      <MiniCard icon={Terminal} title={t("docker.command")}>
        <code
          className="block overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px]"
          title={container.command}
        >
          {container.command || "–"}
        </code>
      </MiniCard>

      {links.length > 0 && (
        <div className="flex gap-2 pt-1">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => openUrl(l.url!)}
              className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2 py-1 text-[11.5px] hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/[0.06]"
            >
              {l.label}
              <ExternalLink size={11} className="opacity-50" />
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-black/5 pt-3 dark:border-white/5">
        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-2.5 py-1 text-[11.5px] text-red-600 hover:bg-red-500/10 dark:text-red-400"
          >
            <Trash2 size={12} />
            {t("docker.deleteContainer")}
          </button>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[12px]">
              <input
                type="checkbox"
                checked={withImage}
                onChange={(e) => setWithImage(e.target.checked)}
              />
              {t("docker.removeImageToo")}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[12px] opacity-80">{t("docker.confirmDelete")}</span>
              <button
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: container.id, withImage })}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-[11.5px] font-medium text-white disabled:opacity-70"
              >
                {remove.isPending && <Loader2 size={12} className="animate-spin" />}
                {remove.isPending ? t("docker.deleting") : t("docker.confirmYesDelete")}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md border border-black/15 px-2.5 py-1 text-[11.5px] dark:border-white/15"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Docker() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useDockerContainers();
  const action = useDockerAction();
  const autostart = useDockerAutostart();
  const { stats } = useDockerStats();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const containers = data?.docker.containers ?? [];

  const runningCount = containers.filter((c) => c.state === "RUNNING").length;
  const stoppedCount = containers.length - runningCount;
  const updatesCount = containers.filter((c) => c.isUpdateAvailable).length;

  const visibleContainers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? containers.filter((c) => {
          const name = c.names[0]?.replace(/^\//, "") ?? c.id;
          return name.toLowerCase().includes(q) || c.image.toLowerCase().includes(q);
        })
      : containers;
    return [...filtered].sort((a, b) => {
      if (a.state === b.state) {
        const nameA = a.names[0]?.replace(/^\//, "") ?? a.id;
        const nameB = b.names[0]?.replace(/^\//, "") ?? b.id;
        return nameA.localeCompare(nameB);
      }
      return a.state === "RUNNING" ? -1 : b.state === "RUNNING" ? 1 : 0;
    });
  }, [containers, query]);

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
      <TopBar title={t("docker.title")} />
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
      {error && <ErrorNotice error={error} />}
      {action.isError && <ErrorNotice error={action.error} />}

      <div className="mb-2 flex items-center justify-between">
        <GroupLabel>{t("docker.containers")}</GroupLabel>
        <div className="flex items-center gap-1.5 pb-1.5">
          {runningCount > 0 && <Badge tone="good">{t("docker.running", { count: runningCount })}</Badge>}
          {stoppedCount > 0 && <Badge tone="neutral">{t("docker.stopped", { count: stoppedCount })}</Badge>}
          {updatesCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0A84FF]/15 px-2 py-0.5 text-[11.5px] font-medium text-[#0A84FF]">
              <Sparkles size={11} />
              {t("docker.updatesAvailable", { count: updatesCount })}
            </span>
          )}
        </div>
      </div>

      <div className="relative mb-3 max-w-xs">
        <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("docker.searchPlaceholder")}
          className="w-full rounded-lg border border-black/10 bg-black/[0.03] py-1.5 pl-8 pr-3 text-[12.5px] outline-none focus:border-[var(--accent)] dark:border-white/10 dark:bg-white/[0.05]"
        />
      </div>

      <div className={`overflow-hidden ${CARD}`}>
        <table className="w-full text-left text-[12.5px]">
          <thead className="bg-black/[0.03] text-[11px] uppercase tracking-wide opacity-55 dark:bg-white/[0.06]">
            <tr>
              <th className="w-7 px-3 py-2" />
              <th className="px-3 py-2 font-medium">{t("common.name")}</th>
              <th className="px-3 py-2 font-medium">{t("common.status")}</th>
              <th className="px-3 py-2 font-medium">{t("docker.image")}</th>
              <th className="px-3 py-2 font-medium">{t("docker.autostart")}</th>
              <th className="px-3 py-2 font-medium text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleContainers.map((c) => {
              const name = c.names[0]?.replace(/^\//, "") ?? c.id;
              const running = c.state === "RUNNING";
              const paused = c.state === "PAUSED";
              const busy = action.isPending && action.variables?.id === c.id;
              const isOpen = expanded.has(c.id);
              const cStats = stats[c.id];
              return (
                <Fragment key={c.id}>
                  <tr
                    onClick={() => toggle(c.id)}
                    className="cursor-pointer border-t border-black/5 hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-1.5">
                      <ChevronRight
                        size={13}
                        className={`opacity-50 transition-transform ${isOpen ? "rotate-90" : ""}`}
                      />
                    </td>
                    <td className="px-3 py-1.5 font-medium">
                      <div className="flex items-center gap-2">
                        {c.iconUrl ? (
                          <img
                            src={c.iconUrl}
                            alt=""
                            className="h-6 w-6 rounded-[7px] shadow-sm"
                          />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#0891B2] shadow-sm">
                            <ContainerIcon size={13} strokeWidth={2.5} className="text-white" />
                          </span>
                        )}
                        {name}
                        {c.isUpdateAvailable && (
                          <span
                            title={t("docker.updateAvailable")}
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0A84FF]"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <Badge tone={tone(c.state)}>{c.status}</Badge>
                    </td>
                    <td className="max-w-0 truncate px-3 py-1.5 opacity-70" title={c.image}>
                      {c.image}
                    </td>
                    <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {autostart.isPending && autostart.variables?.id === c.id ? (
                          <Loader2 size={14} className="animate-spin opacity-50" />
                        ) : (
                          <Toggle
                            checked={c.autoStart}
                            onChange={(value) =>
                              autostart.mutate({ id: c.id, autoStart: value, wait: c.autoStartWait })
                            }
                          />
                        )}
                        {c.autoStart && c.autoStartOrder != null && (
                          <span className="text-[11px] opacity-50">#{c.autoStartOrder}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {c.webUiUrl && (
                          <button
                            onClick={() => openUrl(c.webUiUrl!)}
                            className="rounded-md p-1.5 text-[#0A84FF] hover:bg-[#0A84FF]/10"
                            title={t("docker.openWebUi")}
                          >
                            <ExternalLink size={17} />
                          </button>
                        )}
                        {busy && (
                          <span className="flex items-center p-1.5 text-[#0A84FF]">
                            <Loader2 size={17} className="animate-spin" />
                          </span>
                        )}
                        {!busy && !running && (
                          <button
                            onClick={() => action.mutate({ id: c.id, action: "start" })}
                            className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                            title={t("common.start")}
                          >
                            <Play size={17} />
                          </button>
                        )}
                        {!busy && running && !paused && (
                          <button
                            onClick={() => action.mutate({ id: c.id, action: "stop" })}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                            title={t("common.stop")}
                          >
                            <Square size={17} />
                          </button>
                        )}
                        {!busy && paused && (
                          <button
                            onClick={() => action.mutate({ id: c.id, action: "unpause" })}
                            className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                            title={t("common.resume")}
                          >
                            <Play size={17} />
                          </button>
                        )}
                        {!busy && running && !paused && (
                          <button
                            onClick={() => action.mutate({ id: c.id, action: "pause" })}
                            className="rounded-md p-1.5 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                            title={t("common.pause")}
                          >
                            <Pause size={17} />
                          </button>
                        )}
                        {!busy && (
                          <button
                            onClick={() => action.mutate({ id: c.id, action: "restart" })}
                            className="rounded-md p-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                            title={t("common.restart")}
                          >
                            <RotateCw size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-black/5 bg-black/[0.03] dark:border-white/5 dark:bg-white/[0.05]">
                      <td colSpan={6}>
                        <ContainerDetails container={c} stats={cStats} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {isLoading && <TableLoadingRow colSpan={6} />}
            {!isLoading && visibleContainers.length === 0 && (
              <tr>
                <td className="px-3 py-3 opacity-50" colSpan={6}>
                  {containers.length === 0 ? t("docker.noContainers") : t("docker.noSearchResults")}
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
