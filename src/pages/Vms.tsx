import { useState } from "react";
import { Loader2, Monitor, Pause, Play, RotateCcw, RotateCw, Square, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useVmAction, useVms } from "../lib/queries";
import { Badge } from "../components/StatusDot";
import { TopBar } from "../components/TopBar";
import { GroupLabel } from "../components/GroupedList";
import { CARD } from "../lib/ui";
import { ErrorNotice } from "../components/ErrorNotice";
import { TableLoadingRow } from "../components/Loading";
import type { VmState } from "../lib/types";

function tone(state: VmState): "good" | "warn" | "neutral" {
  if (state === "RUNNING") return "good";
  if (state === "PAUSED" || state === "IDLE") return "warn";
  return "neutral";
}

export function Vms() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useVms();
  const action = useVmAction();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<"forceStop" | "reset" | null>(null);

  const domains = data?.vms.domains ?? [];

  function startConfirm(id: string, act: "forceStop" | "reset") {
    setConfirmingId(id);
    setConfirmingAction(act);
  }

  function cancelConfirm() {
    setConfirmingId(null);
    setConfirmingAction(null);
  }

  function confirmAction() {
    if (confirmingId && confirmingAction) {
      action.mutate({ id: confirmingId, action: confirmingAction });
    }
    cancelConfirm();
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t("vms.title")} />
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
      {error && <ErrorNotice error={error} />}

      <GroupLabel>{t("vms.title")}</GroupLabel>
      <div className={`overflow-hidden ${CARD}`}>
        <table className="w-full text-left text-[12.5px]">
          <thead className="bg-black/[0.03] text-[11px] uppercase tracking-wide opacity-55 dark:bg-white/[0.06]">
            <tr>
              <th className="px-3 py-2 font-medium">{t("common.name")}</th>
              <th className="px-3 py-2 font-medium">{t("common.status")}</th>
              <th className="px-3 py-2 font-medium text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((vm) => {
              const running = vm.state === "RUNNING";
              const paused = vm.state === "PAUSED";
              const busy = action.isPending && action.variables?.id === vm.id;
              const confirming = confirmingId === vm.id;
              return (
                <tr key={vm.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-3 py-1.5 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#8B5CF6] shadow-sm">
                        <Monitor size={11} strokeWidth={2.5} className="text-white" />
                      </span>
                      {vm.name ?? vm.id}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <Badge tone={tone(vm.state)}>{vm.state}</Badge>
                  </td>
                  <td className="px-3 py-1.5">
                    {confirming ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[12px] opacity-80">
                          {confirmingAction === "forceStop"
                            ? t("vms.confirmForceStop")
                            : t("vms.confirmReset")}
                        </span>
                        <button
                          onClick={confirmAction}
                          className="rounded-md bg-red-600 px-2.5 py-1 text-[11.5px] font-medium text-white"
                        >
                          {confirmingAction === "forceStop" ? t("vms.yesForceStop") : t("vms.yesReset")}
                        </button>
                        <button
                          onClick={cancelConfirm}
                          className="rounded-md border border-black/15 px-2.5 py-1 text-[11.5px] dark:border-white/15"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        {busy && (
                          <span className="flex items-center p-1.5 text-[#0A84FF]">
                            <Loader2 size={17} className="animate-spin" />
                          </span>
                        )}
                        {!busy && !running && !paused && (
                          <button
                            onClick={() => action.mutate({ id: vm.id, action: "start" })}
                            className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                            title={t("common.start")}
                          >
                            <Play size={17} />
                          </button>
                        )}
                        {!busy && paused && (
                          <button
                            onClick={() => action.mutate({ id: vm.id, action: "resume" })}
                            className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                            title={t("common.resume")}
                          >
                            <Play size={17} />
                          </button>
                        )}
                        {!busy && running && (
                          <button
                            onClick={() => action.mutate({ id: vm.id, action: "stop" })}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                            title={t("vms.stopAcpi")}
                          >
                            <Square size={17} />
                          </button>
                        )}
                        {!busy && running && (
                          <button
                            onClick={() => action.mutate({ id: vm.id, action: "pause" })}
                            className="rounded-md p-1.5 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                            title={t("common.pause")}
                          >
                            <Pause size={17} />
                          </button>
                        )}
                        {!busy && running && (
                          <button
                            onClick={() => action.mutate({ id: vm.id, action: "reboot" })}
                            className="rounded-md p-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                            title={t("common.restart")}
                          >
                            <RotateCw size={17} />
                          </button>
                        )}
                        {!busy && (running || paused) && (
                          <button
                            onClick={() => startConfirm(vm.id, "reset")}
                            className="rounded-md p-1.5 text-orange-600 hover:bg-orange-500/10 dark:text-orange-400"
                            title={t("vms.reset")}
                          >
                            <RotateCcw size={17} />
                          </button>
                        )}
                        {!busy && (running || paused) && (
                          <button
                            onClick={() => startConfirm(vm.id, "forceStop")}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                            title={t("vms.forceStop")}
                          >
                            <Zap size={17} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {isLoading && <TableLoadingRow colSpan={3} />}
            {!isLoading && domains.length === 0 && (
              <tr>
                <td className="px-3 py-3 opacity-50" colSpan={3}>
                  {t("vms.noVms")}
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
