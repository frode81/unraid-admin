import { useEffect, useState } from "react";
import { getConnectionHost } from "./lib/api";
import { Sidebar, type Page } from "./components/Sidebar";
import { Setup } from "./pages/Setup";
import { Dashboard } from "./pages/Dashboard";
import { Docker } from "./pages/Docker";
import { Vms } from "./pages/Vms";
import { Shares } from "./pages/Shares";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { NotificationWatcher } from "./lib/notificationWatcher";

function App() {
  const [host, setHost] = useState<string | null | undefined>(undefined);
  const [page, setPage] = useState<Page>("dashboard");

  useEffect(() => {
    getConnectionHost().then(setHost);
  }, []);

  if (host === undefined) {
    return (
      <div
        data-tauri-drag-region
        className="h-full w-full bg-white dark:bg-[#1e1e1e]"
      />
    );
  }

  if (!host) {
    return <Setup onConnected={() => getConnectionHost().then(setHost)} />;
  }

  return (
    <div className="flex h-full w-full">
      <NotificationWatcher />
      <Sidebar current={page} onSelect={setPage} host={host} />
      <main className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#1e1e1e]">
        {page === "dashboard" && <Dashboard />}
        {page === "docker" && <Docker />}
        {page === "vms" && <Vms />}
        {page === "shares" && <Shares host={host} />}
        {page === "notifications" && <Notifications />}
        {page === "settings" && (
          <Settings host={host} onDisconnected={() => setHost(null)} />
        )}
      </main>
    </div>
  );
}

export default App;
