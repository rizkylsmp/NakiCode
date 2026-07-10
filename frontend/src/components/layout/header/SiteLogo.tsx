export function SiteLogo() {
  return (
    <a
      className="flex shrink-0 items-center"
      href="/"
      aria-label="NakiCode home"
    >
      <img
        className="naki-logo-image h-11 max-w-[156px] object-contain sm:h-12 sm:max-w-[176px]"
        src="/logo.png"
        alt="Naki Code"
        width="1024"
        height="1024"
      />
    </a>
  );
}
