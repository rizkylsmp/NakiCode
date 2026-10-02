import { Monitor, Moon, SlidersHorizontal, Sun } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { LanguageSwitch } from "../LanguageSwitch";
import type { ThemePreference } from "../../../utils/theme";

type PreferencesProps = {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
};

export function PreferencesControls({
  theme,
  onThemeChange,
}: PreferencesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-naki-primary">Bahasa</span>
        <LanguageSwitch />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-naki-primary">
          Tema
        </legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-naki-steel bg-naki-frost p-1">
          {(
            [
              { value: "light", label: "Terang", icon: Sun },
              { value: "dark", label: "Gelap", icon: Moon },
              { value: "system", label: "Sistem", icon: Monitor },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => onThemeChange(value)}
              className={`flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1 text-[11px] font-semibold transition focus-visible:ring-2 focus-visible:ring-naki-secondary ${theme === value ? "bg-naki-primary text-white" : "text-naki-smoke hover:text-naki-primary"}`}
            >
              <Icon size={15} className="shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function PreferencesMenu(props: PreferencesProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      className="relative"
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label="Preferensi"
        title="Preferensi"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? id : undefined}
        ref={triggerRef}
        onClick={() => setOpen((current) => !current)}
        className="grid size-11 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-secondary focus-visible:ring-2 focus-visible:ring-naki-secondary"
      >
        <SlidersHorizontal size={18} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={id}
          ref={panelRef}
          role="dialog"
          aria-label="Preferensi tampilan"
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-naki-steel bg-white p-4 shadow-naki-card"
        >
          <p className="mb-4 text-sm font-semibold text-naki-primary">
            Preferensi
          </p>
          <PreferencesControls {...props} />
        </div>
      )}
    </div>
  );
}
