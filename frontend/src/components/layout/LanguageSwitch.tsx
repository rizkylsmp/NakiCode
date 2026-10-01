import { useLanguage } from "../../i18n/language";
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className="flex shrink-0 rounded-lg border border-naki-steel bg-naki-frost p-0.5"
      role="group"
      aria-label="Bahasa"
    >
      {(["id", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={language === item}
          aria-label={item === "id" ? "Bahasa Indonesia" : "English"}
          className={`min-h-10 min-w-9 rounded-md px-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-naki-secondary ${language === item ? "bg-naki-primary text-white" : "text-naki-smoke hover:text-naki-primary"}`}
          onClick={() => setLanguage(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
