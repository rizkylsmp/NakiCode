import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  isDarkMode: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ isDarkMode, onToggle }: ThemeToggleProps) {
  return (
    <button
      className="relative grid size-10 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
      type="button"
      aria-label={isDarkMode ? "Aktifkan light mode" : "Aktifkan dark mode"}
      aria-pressed={isDarkMode}
      onClick={onToggle}
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
