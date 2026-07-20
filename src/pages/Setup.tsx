import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Info,
  KeyRound,
  Server,
  X,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Trans, useTranslation } from "react-i18next";
import { saveConnection, testConnection } from "../lib/api";
import { SegmentedControl } from "../components/Native";
import { setLanguage } from "../i18n";

const LANGUAGE_OPTIONS = [
  { value: "nb", label: "NO" },
  { value: "en", label: "EN" },
];

export function Setup({ onConnected }: { onConnected: () => void }) {
  const { t, i18n } = useTranslation();
  const [host, setHost] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const canSubmit = host.trim().length > 0 && apiKey.trim().length > 0;

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await testConnection(host.trim(), apiKey.trim());
      setResult(res);
    } catch (e) {
      setResult({ ok: false, message: String(e) });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (!result?.ok) {
        const res = await testConnection(host.trim(), apiKey.trim());
        setResult(res);
        if (!res.ok) {
          setSaving(false);
          return;
        }
      }
      await saveConnection(host.trim(), apiKey.trim());
      onConnected();
    } catch (e) {
      setResult({ ok: false, message: String(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-tauri-drag-region
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white dark:bg-[#1e1e1e]"
    >
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-gradient-to-br from-[#FF8A3D]/35 to-[#F5701A]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-gradient-to-br from-[#0A84FF]/25 to-[#8B5CF6]/10 blur-3xl" />

      <div className="absolute left-4 top-9 z-20">
        <SegmentedControl
          value={i18n.language}
          onChange={(v) => setLanguage(v as "nb" | "en")}
          options={LANGUAGE_OPTIONS}
        />
      </div>

      <button
        onClick={() => setShowInfo((v) => !v)}
        title={t("setup.infoTooltip")}
        className="absolute right-4 top-9 z-20 flex h-6 w-6 items-center justify-center rounded-full text-black/40 hover:bg-black/[0.06] hover:text-black/70 dark:text-white/40 dark:hover:bg-white/[0.08] dark:hover:text-white/80"
      >
        <Info size={15} />
      </button>

      {showInfo && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowInfo(false)} />
          <div className="absolute right-4 top-16 z-20 w-72 rounded-xl border border-black/10 bg-white p-4 text-left shadow-xl dark:border-white/10 dark:bg-[#2a2a2a]">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">{t("setup.aboutTitle")}</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="opacity-50 hover:opacity-80"
              >
                <X size={14} />
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed opacity-70">
              {t("setup.aboutDescription1")}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed opacity-70">
              {t("setup.aboutDescription2")}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed opacity-50">
              {t("setup.disclaimer")}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => openUrl("https://roste-consulting.no/")}
                className="text-[11px] font-medium opacity-55 hover:opacity-80 hover:underline"
              >
                {t("setup.madeBy", { name: "Frode Røste" })}
              </button>
              {version && <span className="text-[11px] opacity-40">v{version}</span>}
            </div>
          </div>
        </>
      )}

      <div className="relative w-[400px] rounded-2xl border border-black/10 bg-white/80 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#2a2a2a]/80">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#FF8A3D] to-[#F5701A] shadow-lg shadow-orange-500/30">
            <Server size={26} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="mt-3 text-[16px] font-semibold">{t("setup.title")}</h1>
          <p className="mt-1.5 text-[12px] leading-relaxed opacity-60">
            <Trans
              i18nKey="setup.description"
              components={{ bold: <span className="font-medium opacity-80" /> }}
            />
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-55">
              {t("setup.serverAddress")}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white px-2.5 py-2 focus-within:border-[var(--accent)] dark:border-white/15 dark:bg-white/5">
              <Globe size={14} className="shrink-0 opacity-45" />
              <input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.10"
                className="w-full min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-55">
              {t("setup.apiKey")}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white px-2.5 py-2 focus-within:border-[var(--accent)] dark:border-white/15 dark:bg-white/5">
              <KeyRound size={14} className="shrink-0 opacity-45" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••"
                className="w-full min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              />
            </div>
          </div>
        </div>

        {result && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] ${
              result.ok
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {result.ok ? (
              <CheckCircle2 size={14} className="shrink-0" />
            ) : (
              <AlertCircle size={14} className="shrink-0" />
            )}
            <span className="leading-snug">{result.message}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            disabled={!canSubmit || testing}
            onClick={handleTest}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-40 dark:border-white/15"
          >
            <CheckCircle2 size={13} />
            {testing ? t("setup.testing") : t("setup.testConnection")}
          </button>
          <button
            disabled={!canSubmit || saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#FF9955] to-[#F5701A] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-sm shadow-orange-500/30 disabled:opacity-40"
          >
            {saving ? t("setup.saving") : t("setup.connect")}
            {!saving && <ArrowRight size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}
