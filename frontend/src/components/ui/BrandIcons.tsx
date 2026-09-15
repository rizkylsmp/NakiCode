type BrandIconProps = {
  className?: string;
};

function BrandIcon({
  className,
  height,
  src,
  width,
}: BrandIconProps & { height: number; src: string; width: number }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={`shrink-0 object-contain ${className ?? "size-5"}`}
      decoding="async"
      draggable={false}
      height={height}
      src={src}
      width={width}
    />
  );
}

export function GoogleBrandIcon(props: BrandIconProps) {
  return (
    <BrandIcon
      {...props}
      height={360}
      src="/images/brand/google.png"
      width={360}
    />
  );
}

export function WhatsAppBrandIcon(props: BrandIconProps) {
  return (
    <BrandIcon
      {...props}
      height={1024}
      src="/images/brand/whatsapp.png"
      width={1024}
    />
  );
}
