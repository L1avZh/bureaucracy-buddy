import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en/common.json";
import he from "@/locales/he/common.json";
import type { Locale } from "@/types/domain";

export const RTL_LOCALES: Locale[] = ["he"];

export function applyDocumentDirection(locale: Locale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { common: en },
    he: { common: he },
  },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function setAppLocale(locale: Locale): void {
  void i18next.changeLanguage(locale);
  applyDocumentDirection(locale);
}

export default i18next;
