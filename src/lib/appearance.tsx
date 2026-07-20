import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type AppearanceMode = "system" | "light" | "dark";
const STORAGE_KEY = "unraid-admin.appearance";

interface AppearanceContextValue {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
}

const AppearanceContext = createContext<AppearanceContextValue>({
  mode: "system",
  setMode: () => {},
});

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    getCurrentWindow().setTheme(mode === "system" ? null : mode);
  }, [mode]);

  function setMode(next: AppearanceMode) {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <AppearanceContext.Provider value={{ mode, setMode }}>{children}</AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
