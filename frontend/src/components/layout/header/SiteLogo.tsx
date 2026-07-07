export function SiteLogo() {
  return (
    <a
      className="flex shrink-0 items-center"
      href="/"
      aria-label="NakiCode home"
    >
      <img
        className="naki-logo-image h-9 max-w-[132px] object-contain sm:h-10 sm:max-w-[152px]"
        src="/logo.png"
        alt="Naki Code"
        width="1024"
        height="1024"
      />
    </a>
  );
}
