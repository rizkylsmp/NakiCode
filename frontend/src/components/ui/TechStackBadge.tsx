import {
  Atom,
  Braces,
  Cloud,
  Code2,
  Database,
  Layers3,
  Server,
  Smartphone,
  TerminalSquare,
  type LucideIcon,
} from "lucide-react";

type TechStackBadgeProps = {
  tech: string;
  variant?: "plain" | "pill";
};

const iconMatchers: Array<[RegExp, LucideIcon]> = [
  [/react/i, Atom],
  [/next|nuxt|astro/i, Layers3],
  [/html|css|tailwind|bootstrap|javascript|typescript|vue|svelte|angular/i, Braces],
  [/mysql|postgres|mongo|database|supabase|firebase|sqlite|prisma/i, Database],
  [/node|express|nestjs|laravel|php|django|python|ruby|java|spring|golang|go\b/i, Server],
  [/flutter|react native|android|ios|mobile/i, Smartphone],
  [/vercel|netlify|cloudinary|aws|azure|cloud|docker/i, Cloud],
  [/vite|webpack|bun|npm|pnpm|yarn/i, TerminalSquare],
];

export function TechStackBadge({ tech, variant = "plain" }: TechStackBadgeProps) {
  const Icon = iconMatchers.find(([pattern]) => pattern.test(tech))?.[1] ?? Code2;

  return (
    <span
      className={variant === "pill"
        ? "inline-flex items-center gap-1.5 rounded-md bg-naki-frost px-3 py-1 text-xs font-medium text-naki-smoke"
        : "inline-flex items-center gap-1 text-xs font-medium text-naki-smoke"}
    >
      <Icon aria-hidden="true" className="shrink-0 text-naki-secondary" size={13} strokeWidth={2} />
      {tech}
    </span>
  );
}
