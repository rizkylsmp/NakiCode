export function SiteLogo() {
  return (
    <a
      className="flex shrink-0 items-center"
      href="/"
      aria-label="NakiCode home"
    >
      <img
        className="naki-logo-image size-10 object-contain min-[360px]:size-11 sm:size-12"
        src="/logo.png"
        alt="Naki Code"
        width="1024"
        height="1024"
      />
    </a>
  );
}
