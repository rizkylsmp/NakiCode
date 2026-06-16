type LogoMarkProps = {
  className?: string;
  imageClassName?: string;
  alt?: string;
};

export function LogoMark({
  className = "grid size-10 place-items-center rounded-lg",
  imageClassName = "size-10 object-contain",
  alt = "Naki Code",
}: LogoMarkProps) {
  return (
    <span className={className}>
      <img className={imageClassName} src="/logo.png" alt={alt} />
    </span>
  );
}
