import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useTranslation } from "react-i18next";
import { clearConnection } from "../lib/api";
import { TopBar } from "../components/TopBar";
import { NativeSelect, SegmentedControl, Toggle } from "../components/Native";
import { Group, GroupLabel, Row } from "../components/GroupedList";
import { useRefreshInterval } from "../lib/settings";
import { useAppearance, type AppearanceMode } from "../lib/appearance";
import { useNotificationSettings } from "../lib/notificationSettings";
import { notify } from "../lib/notifications";
import { useRegistration } from "../lib/queries";
import { setLanguage } from "../i18n";

export function Settings({
  host,
  onDisconnected,
}: {
  host: string | null;
  onDisconnected: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const { intervalMs, setIntervalMs, enabled, setEnabled } = useRefreshInterval();
  const { mode, setMode } = useAppearance();
  const {
    dockerUpdates,
    setDockerUpdates,
    containerCrashed,
    setContainerCrashed,
    diskHealth,
    setDiskHealth,
    unraidEvents,
    setUnraidEvents,
  } = useNotificationSettings();
  const { data: registrationData } = useRegistration();
  const registration = registrationData?.registration;

  const intervalOptions = [
    { value: "3000", label: t("settings.seconds", { count: 3 }) },
    { value: "5000", label: t("settings.seconds", { count: 5 }) },
    { value: "10000", label: t("settings.seconds", { count: 10 }) },
    { value: "30000", label: t("settings.seconds", { count: 30 }) },
  ];

  const appearanceOptions = [
    { value: "system", label: t("settings.themeSystem") },
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
  ];

  const languageOptions = [
    { value: "nb", label: t("settings.languageNorwegian") },
    { value: "en", label: t("settings.languageEnglish") },
  ];

  useEffect(() => {
    getVersion().then(setVersion);
    isEnabled().then(setLaunchAtLogin);
  }, []);

  async function handleForget() {
    await clearConnection();
    onDisconnected();
  }

  async function handleLaunchAtLoginChange(value: boolean) {
    setLaunchAtLogin(value);
    if (value) await enable();
    else await disable();
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t("settings.title")} />
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
        <div className="mx-auto max-w-lg">
          <GroupLabel>{t("settings.connection")}</GroupLabel>
          <Group>
            <Row label={t("settings.server")}>{host ?? t("settings.notConnected")}</Row>
            {!confirming ? (
              <Row label={t("settings.action")} last muted={false}>
                <button
                  onClick={() => setConfirming(true)}
                  className="text-red-600 hover:underline dark:text-red-400"
                >
                  {t("settings.forgetConnection")}
                </button>
              </Row>
            ) : (
              <div className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                <span className="opacity-70">{t("settings.confirmForget")}</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleForget}
                    className="rounded-md bg-red-600 px-2.5 py-1 text-[11.5px] font-medium text-white"
                  >
                    {t("settings.yesForget")}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="rounded-md border border-black/15 px-2.5 py-1 text-[11.5px] dark:border-white/15"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}
          </Group>

          <div className="mt-6">
            <GroupLabel>{t("settings.appearance")}</GroupLabel>
            <Group>
              <Row label={t("settings.theme")} muted={false}>
                <SegmentedControl
                  value={mode}
                  onChange={(v) => setMode(v as AppearanceMode)}
                  options={appearanceOptions}
                />
              </Row>
              <Row label={t("settings.language")} last muted={false}>
                <SegmentedControl
                  value={i18n.language}
                  onChange={(v) => setLanguage(v as "nb" | "en")}
                  options={languageOptions}
                />
              </Row>
            </Group>
          </div>

          <div className="mt-6">
            <GroupLabel>{t("settings.updateSection")}</GroupLabel>
            <Group>
              <Row label={t("settings.autoUpdate")} muted={false}>
                <Toggle checked={enabled} onChange={setEnabled} />
              </Row>
              <Row label={t("settings.interval")} last muted={false}>
                <NativeSelect
                  value={String(intervalMs)}
                  onChange={(v) => setIntervalMs(Number(v))}
                  options={intervalOptions}
                  disabled={!enabled}
                />
              </Row>
            </Group>
          </div>

          <div className="mt-6">
            <GroupLabel>{t("settings.notificationsSection")}</GroupLabel>
            <Group>
              <Row label={t("settings.notifyDockerUpdates")} muted={false}>
                <Toggle checked={dockerUpdates} onChange={setDockerUpdates} />
              </Row>
              <Row label={t("settings.notifyContainerCrashed")} muted={false}>
                <Toggle checked={containerCrashed} onChange={setContainerCrashed} />
              </Row>
              <Row label={t("settings.notifyDiskHealth")} muted={false}>
                <Toggle checked={diskHealth} onChange={setDiskHealth} />
              </Row>
              <Row label={t("settings.notifyUnraidEvents")} muted={false}>
                <Toggle checked={unraidEvents} onChange={setUnraidEvents} />
              </Row>
              <Row label={t("settings.notifyTest")} last muted={false}>
                <button
                  onClick={() => notify(t("notifications.testTitle"), t("notifications.testBody"))}
                  className="text-[#0A84FF] hover:underline"
                >
                  {t("settings.notifyTestAction")}
                </button>
              </Row>
            </Group>
          </div>

          <div className="mt-6">
            <GroupLabel>{t("settings.startupSection")}</GroupLabel>
            <Group>
              <Row label={t("settings.launchAtLogin")} last muted={false}>
                <Toggle checked={launchAtLogin} onChange={handleLaunchAtLoginChange} />
              </Row>
            </Group>
          </div>

          <div className="mt-6">
            <GroupLabel>{t("settings.about")}</GroupLabel>
            <Group>
              <div className="flex items-start gap-3 border-b border-black/5 px-4 py-3 dark:border-white/5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#FF8A3D] to-[#F5701A] shadow-sm">
                  <Server size={16} strokeWidth={2.5} className="text-white" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold">Admin for Unraid</div>
                  <div className="mt-0.5 text-[12px] leading-relaxed opacity-60">
                    {t("settings.aboutDescription")}
                  </div>
                </div>
              </div>
              <Row label={t("settings.version")}>{version ? `v${version}` : "–"}</Row>
              <Row label={t("settings.builtWith")}>Tauri · Rust · React</Row>
              <Row label={t("settings.graphqlApi")}>Unraid API</Row>
              {registration?.type && (
                <Row label={t("settings.license")}>
                  {registration.type}
                  {registration.type === "TRIAL" &&
                    registration.expiration &&
                    Number(registration.expiration) > 0 &&
                    ` · ${t("settings.licenseExpires", { date: new Date(Number(registration.expiration)).toLocaleDateString() })}`}
                </Row>
              )}
              <Row label={t("settings.developedBy")} muted={false}>
                <button
                  onClick={() => openUrl("https://roste-consulting.no/")}
                  className="opacity-60 hover:underline hover:opacity-90"
                >
                  Frode Røste
                </button>
              </Row>
              <div className="px-4 py-3 text-[11px] leading-relaxed opacity-45">
                {t("settings.disclaimer")}
              </div>
            </Group>
          </div>
        </div>
      </div>
    </div>
  );
}
