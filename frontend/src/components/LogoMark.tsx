import { Code2 } from "lucide-react";

type LogoMarkProps = {
  className?: string;
  size?: number;
};

export function LogoMark({
  className = "grid size-10 place-items-center rounded-lg bg-blue-500/10",
  size = 22,
}: LogoMarkProps) {
  return (
    <span className={className}>
      <Code2 className="text-blue-500" size={size} />
    </span>
  );
}
