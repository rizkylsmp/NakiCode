type LogoMarkProps = {
  className?: string;
  size?: number;
};

export function LogoMark({
  className = "naki-logo-image h-10 w-auto object-contain",
  size = 40,
}: LogoMarkProps) {
  return (
    <img
      className={className}
      src="/logo.png"
      alt="Naki Code"
      width={size}
      height={size}
    />
  );
}
