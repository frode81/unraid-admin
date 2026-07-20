import { createContext, useContext, useState, type ReactNode } from "react";

const DOCKER_UPDATES_KEY = "unraid-admin.notify-docker-updates";
const CONTAINER_CRASHED_KEY = "unraid-admin.notify-container-crashed";
const DISK_HEALTH_KEY = "unraid-admin.notify-disk-health";
const UNRAID_EVENTS_KEY = "unraid-admin.notify-unraid-events";

interface NotificationSettingsContextValue {
  dockerUpdates: boolean;
  setDockerUpdates: (value: boolean) => void;
  containerCrashed: boolean;
  setContainerCrashed: (value: boolean) => void;
  diskHealth: boolean;
  setDiskHealth: (value: boolean) => void;
  unraidEvents: boolean;
  setUnraidEvents: (value: boolean) => void;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextValue>({
  dockerUpdates: true,
  setDockerUpdates: () => {},
  containerCrashed: true,
  setContainerCrashed: () => {},
  diskHealth: true,
  setDiskHealth: () => {},
  unraidEvents: true,
  setUnraidEvents: () => {},
});

function readBool(key: string): boolean {
  const stored = localStorage.getItem(key);
  return stored === null ? true : stored === "true";
}

export function NotificationSettingsProvider({ children }: { children: ReactNode }) {
  const [dockerUpdates, setDockerUpdatesState] = useState(() => readBool(DOCKER_UPDATES_KEY));
  const [containerCrashed, setContainerCrashedState] = useState(() => readBool(CONTAINER_CRASHED_KEY));
  const [diskHealth, setDiskHealthState] = useState(() => readBool(DISK_HEALTH_KEY));
  const [unraidEvents, setUnraidEventsState] = useState(() => readBool(UNRAID_EVENTS_KEY));

  function setDockerUpdates(value: boolean) {
    setDockerUpdatesState(value);
    localStorage.setItem(DOCKER_UPDATES_KEY, String(value));
  }

  function setContainerCrashed(value: boolean) {
    setContainerCrashedState(value);
    localStorage.setItem(CONTAINER_CRASHED_KEY, String(value));
  }

  function setDiskHealth(value: boolean) {
    setDiskHealthState(value);
    localStorage.setItem(DISK_HEALTH_KEY, String(value));
  }

  function setUnraidEvents(value: boolean) {
    setUnraidEventsState(value);
    localStorage.setItem(UNRAID_EVENTS_KEY, String(value));
  }

  return (
    <NotificationSettingsContext.Provider
      value={{
        dockerUpdates,
        setDockerUpdates,
        containerCrashed,
        setContainerCrashed,
        diskHealth,
        setDiskHealth,
        unraidEvents,
        setUnraidEvents,
      }}
    >
      {children}
    </NotificationSettingsContext.Provider>
  );
}

export function useNotificationSettings() {
  return useContext(NotificationSettingsContext);
}
