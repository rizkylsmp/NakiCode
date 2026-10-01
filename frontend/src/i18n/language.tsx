import {
  createContext,
  createElement,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { english } from "./messages";
import { additionalEnglish } from "./additional-messages";
import { indonesian } from "./indonesian-messages";
import { statusEnglish, translateSystemStatus } from "./status-messages";

export type Language = "id" | "en";
export const languageStorageKey = "naki-language";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  enabled: boolean;
}>({ language: "id", setLanguage: () => {}, enabled: false });

export function readLanguage(): Language {
  try {
    return localStorage.getItem(languageStorageKey) === "en" ? "en" : "id";
  } catch {
    return "id";
  }
}

export function translateText(value: string, language: Language) {
  const key = value.replace(/\s+/g, " ").trim();
  const translated =
    language === "id"
      ? indonesian[key]
      : (statusEnglish[key] ??
        additionalEnglish[key] ??
        english[key] ??
        translateSystemStatus(key));
  if (translated)
    return `${value.match(/^\s*/)?.[0] ?? ""}${translated}${value.match(/\s*$/)?.[0] ?? ""}`;
  if (language === "en" && /^(?:<|>)?\s*Rp \d+Jt(?: - Rp \d+Jt)?$/.test(key))
    return key.replace(/Rp (\d+)Jt/g, "IDR $1m");
  if (language === "en") {
    const patterns: Array<[RegExp, string]> = [
      [/^Bayar DP (\d+)%$/, "Pay $1% deposit"],
      [/^Ulangi pembayaran DP (\d+)%$/, "Retry $1% deposit payment"],
      [/^Hapus order #(\d+)$/, "Delete order #$1"],
      [/^Catat refund order #(\d+)$/, "Record refund for order #$1"],
      [/^Langkah (\d+) dari (\d+)$/, "Step $1 of $2"],
      [/^Lihat design (.+)$/, "View design $1"],
      [/^Video preview (.+)$/, "Video preview $1"],
      [/^Hapus gambar (\d+)$/, "Remove image $1"],
      [/^(\d+) pemakaian$/, "$1 uses"],
      [/^· Draft tersimpan (.+)$/, "· Draft saved $1"],
    ];
    for (const [pattern, replacement] of patterns)
      if (pattern.test(key)) return key.replace(pattern, replacement);
  }
  return value;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(readLanguage);
  const setLanguage = useCallback((next: Language) => {
    document.documentElement.lang = next;
    try {
      localStorage.setItem(languageStorageKey, next);
    } catch {
      /* Storage is optional. */
    }
    updateLanguage(next);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(languageStorageKey, language);
    } catch {
      /* Private browsing can block storage. */
    }
  }, [language]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === languageStorageKey) setLanguage(readLanguage());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [setLanguage]);
  const value = useMemo(
    () => ({ language, setLanguage, enabled: true }),
    [language, setLanguage],
  );
  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  return useContext(LanguageContext);
}
