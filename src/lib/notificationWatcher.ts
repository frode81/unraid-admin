import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDockerContainers, useArrayStatus, suppressedContainerIds } from "./queries";
import { useNotificationSettings } from "./notificationSettings";
import { useNotificationStream } from "./useNotificationStream";
import { notify } from "./notifications";
import type { ArrayDiskStatus } from "./types";

function containerName(names: string[], id: string): string {
  return names[0]?.replace(/^\//, "") ?? id;
}

function isHealthyDiskStatus(status: ArrayDiskStatus | null): boolean {
  return status === "DISK_OK" || status === "DISK_NEW" || status === "DISK_DSBL_NEW" || status == null;
}

/**
 * Watches polled Docker/array data for state transitions and fires native
 * notifications for them. Mounted once near the app root so it keeps
 * watching regardless of which page is currently open.
 */
export function useNotificationWatcher() {
  const { t } = useTranslation();
  const settings = useNotificationSettings();
  const { data: dockerData } = useDockerContainers();
  const { data: arrayData } = useArrayStatus();

  const prevContainers = useRef<Map<string, { state: string; isUpdateAvailable: boolean }> | null>(null);
  const prevDisks = useRef<Map<string, ArrayDiskStatus | null> | null>(null);

  useEffect(() => {
    const containers = dockerData?.docker.containers;
    if (!containers) return;

    const prev = prevContainers.current;
    const next = new Map<string, { state: string; isUpdateAvailable: boolean }>();

    for (const c of containers) {
      next.set(c.id, { state: c.state, isUpdateAvailable: !!c.isUpdateAvailable });

      const before = prev?.get(c.id);
      if (!before) continue;

      const name = containerName(c.names, c.id);

      if (settings.dockerUpdates && c.isUpdateAvailable && !before.isUpdateAvailable) {
        notify(
          t("notifications.updateAvailableTitle"),
          t("notifications.updateAvailableBody", { name }),
        );
      }

      if (
        settings.containerCrashed &&
        before.state === "RUNNING" &&
        c.state === "EXITED" &&
        !suppressedContainerIds.has(c.id)
      ) {
        notify(
          t("notifications.containerCrashedTitle"),
          t("notifications.containerCrashedBody", { name }),
        );
      }
    }

    prevContainers.current = next;
  }, [dockerData, settings.dockerUpdates, settings.containerCrashed, t]);

  useEffect(() => {
    const array = arrayData?.array;
    if (!array) return;

    const disks = [...array.disks, ...array.caches, ...array.parities];
    const prev = prevDisks.current;
    const next = new Map<string, ArrayDiskStatus | null>();

    for (const disk of disks) {
      next.set(disk.id, disk.status);

      const before = prev?.get(disk.id);
      if (before === undefined) continue;

      if (settings.diskHealth && isHealthyDiskStatus(before) && !isHealthyDiskStatus(disk.status)) {
        notify(
          t("notifications.diskHealthTitle"),
          t("notifications.diskHealthBody", { name: disk.name ?? disk.id, status: disk.status }),
        );
      }
    }

    prevDisks.current = next;
  }, [arrayData, settings.diskHealth, t]);
}

/** Mount once while connected so watching continues regardless of the active page. */
export function NotificationWatcher() {
  useNotificationWatcher();
  useNotificationStream();
  return null;
}
