import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import nb from "./locales/nb.json";
import en from "./locales/en.json";

export const LANGUAGE_STORAGE_KEY = "unraid-admin.language";

const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const initialLanguage = stored === "en" || stored === "nb" ? stored : "nb";

i18n.use(initReactI18next).init({
  resources: {
    nb: { translation: nb },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(lang: "nb" | "en") {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export default i18n;
