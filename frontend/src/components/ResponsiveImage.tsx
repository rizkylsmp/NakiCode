type ResponsiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
};

const responsiveWidths = [480, 768, 1080, 1400];

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw",
  loading = "lazy",
}: ResponsiveImageProps) {
  return (
    <img
      className={className}
      src={src}
      srcSet={buildCloudinarySrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
    />
  );
}

function buildCloudinarySrcSet(src: string) {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return undefined;
  }

  return responsiveWidths
    .map((width) => {
      const optimizedSrc = src.replace(
        "/upload/",
        `/upload/f_auto,q_auto,w_${width}/`,
      );

      return `${optimizedSrc} ${width}w`;
    })
    .join(", ");
}
