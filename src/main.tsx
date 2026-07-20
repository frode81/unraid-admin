import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { RefreshIntervalProvider } from "./lib/settings";
import { AppearanceProvider } from "./lib/appearance";
import { NotificationSettingsProvider } from "./lib/notificationSettings";
import "./i18n";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RefreshIntervalProvider>
        <AppearanceProvider>
          <NotificationSettingsProvider>
            <App />
          </NotificationSettingsProvider>
        </AppearanceProvider>
      </RefreshIntervalProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
