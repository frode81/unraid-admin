import { createContext, useContext, useState, type ReactNode } from "react";

const INTERVAL_KEY = "unraid-admin.refresh-interval-ms";
const ENABLED_KEY = "unraid-admin.refresh-enabled";
const DEFAULT_INTERVAL_MS = 5000;

interface RefreshIntervalContextValue {
  intervalMs: number;
  setIntervalMs: (ms: number) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** Value to pass as react-query's `refetchInterval`. */
  activeInterval: number | false;
}

const RefreshIntervalContext = createContext<RefreshIntervalContextValue>({
  intervalMs: DEFAULT_INTERVAL_MS,
  setIntervalMs: () => {},
  enabled: true,
  setEnabled: () => {},
  activeInterval: DEFAULT_INTERVAL_MS,
});

export function RefreshIntervalProvider({ children }: { children: ReactNode }) {
  const [intervalMs, setIntervalMsState] = useState<number>(() => {
    const stored = Number(localStorage.getItem(INTERVAL_KEY));
    return stored > 0 ? stored : DEFAULT_INTERVAL_MS;
  });
  const [enabled, setEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(ENABLED_KEY);
    return stored === null ? true : stored === "true";
  });

  function setIntervalMs(ms: number) {
    setIntervalMsState(ms);
    localStorage.setItem(INTERVAL_KEY, String(ms));
  }

  function setEnabled(value: boolean) {
    setEnabledState(value);
    localStorage.setItem(ENABLED_KEY, String(value));
  }

  return (
    <RefreshIntervalContext.Provider
      value={{
        intervalMs,
        setIntervalMs,
        enabled,
        setEnabled,
        activeInterval: enabled ? intervalMs : false,
      }}
    >
      {children}
    </RefreshIntervalContext.Provider>
  );
}

export function useRefreshInterval() {
  return useContext(RefreshIntervalContext);
}
