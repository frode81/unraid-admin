import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { DockerContainerStats } from "./types";

/**
 * Consumes the `dockerContainerStats` GraphQL subscription (streamed over a
 * Rust-managed WebSocket, see src-tauri/src/docker_stats.rs) via Tauri events.
 * Starts the stream on mount, stops it on unmount (e.g. when leaving the
 * Docker page) so we don't keep an idle socket open in the background.
 */
export function useDockerStats() {
  const [stats, setStats] = useState<Record<string, DockerContainerStats>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unlistenData: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;

    invoke("start_docker_stats").catch((e) => setError(String(e)));

    listen<DockerContainerStats>("docker-stats", (event) => {
      setStats((prev) => ({ ...prev, [event.payload.id]: event.payload }));
    }).then((un) => {
      if (cancelled) un();
      else unlistenData = un;
    });

    listen<string>("docker-stats-error", (event) => {
      setError(event.payload);
    }).then((un) => {
      if (cancelled) un();
      else unlistenError = un;
    });

    return () => {
      cancelled = true;
      unlistenData?.();
      unlistenError?.();
      invoke("stop_docker_stats").catch(() => {});
    };
  }, []);

  return { stats, error };
}
