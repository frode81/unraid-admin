import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNotificationSettings } from "./notificationSettings";
import { notify } from "./notifications";
import type { UnraidNotification } from "./types";

/**
 * Consumes the `notificationAdded` GraphQL subscription (streamed over a
 * Rust-managed WebSocket, see src-tauri/src/notification_stream.rs) via
 * Tauri events: refreshes the notifications list immediately and, if
 * enabled, forwards it as a native macOS notification.
 */
export function useNotificationStream() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { unraidEvents } = useNotificationSettings();

  useEffect(() => {
    let cancelled = false;
    let unlistenData: (() => void) | undefined;

    invoke("start_notification_stream").catch(() => {});

    listen<UnraidNotification>("unraid-notification", (event) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (unraidEvents && event.payload.importance !== "INFO") {
        notify(event.payload.title, event.payload.subject);
      }
    }).then((un) => {
      if (cancelled) un();
      else unlistenData = un;
    });

    return () => {
      cancelled = true;
      unlistenData?.();
      invoke("stop_notification_stream").catch(() => {});
    };
  }, [queryClient, unraidEvents, t]);
}
