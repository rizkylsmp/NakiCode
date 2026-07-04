import { Code2 } from "lucide-react";

export function SiteLogo() {
  return (
    <a
      className="flex shrink-0 items-center gap-2.5"
      href="/"
      aria-label="NakiCode home"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-blue-500/10">
        <Code2 className="text-blue-500" size={20} />
      </span>
      <span className="text-lg font-bold tracking-tight">
        <span className="text-naki-primary">Naki</span>
        <span className="text-blue-500">Code</span>
      </span>
    </a>
  );
}
