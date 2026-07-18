import { ArrowRight, ExternalLink, Eye, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { MasonryPhotoAlbum, type Photo } from "react-photo-album";
import type { PortfolioItem } from "../../domain/content";
import { normalizeCoverIndex } from "../../pages/admin/AdminTemplateWorkspace.shared";
import { Skeleton, SkeletonText } from "../ui/skeletons/Skeleton";
import "react-photo-album/masonry.css";

type PortfolioSectionProps = {
  items: PortfolioItem[];
  isLoading?: boolean;
};

export function PortfolioSection({ items, isLoading = false }: PortfolioSectionProps) {
  return (
    <section className="w-full">
      <div className="px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                Portofolio
              </p>
              <h2 className="mt-1 text-2xl font-bold text-naki-primary md:text-3xl">
                Website yang sudah kami kerjakan
              </h2>
              <p className="mt-2 max-w-xl text-sm text-naki-smoke">
                Contoh website yang kami kerjakan dari design referensi maupun brief custom.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-500 transition hover:text-blue-600"
              to="/portofolio"
            >
              Lihat semua portofolio
              <ArrowRight size={14} />
            </Link>
          </div>

          <PortfolioGrid items={items.slice(0, 6)} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
}

export function PortfolioGrid({
  items,
  isLoading = false,
}: PortfolioSectionProps) {
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);

  return (
    <>
      <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <PortfolioSkeletonGrid />
        ) : items.length === 0 ? (
          <div className="col-span-full rounded-xl border border-naki-steel/60 bg-white p-10 text-center text-sm text-naki-smoke">
            Belum ada portofolio yang dipublikasikan.
          </div>
        ) : (
          items.map((item) => (
            <PortfolioCard
              key={item.id ?? item.title}
              item={item}
              onPreview={() => setPreviewItem(item)}
            />
          ))
        )}
      </div>

      {previewItem ? (
        <PortfolioPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      ) : null}
    </>
  );
}

function PortfolioSkeletonGrid() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <PortfolioSkeletonCard key={index} />
      ))}
    </>
  );
}

function PortfolioSkeletonCard() {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <Skeleton height="10rem" radius="0" />
      <div className="p-5">
        <Skeleton width="55%" height="1rem" radius="0.25rem" />
        <SkeletonText lines={2} className="mt-4" />
        <div className="mt-5 flex items-center justify-between">
          <Skeleton width="7rem" height="0.875rem" radius="0.25rem" />
          <Skeleton width="2.25rem" height="2.25rem" radius="0.5rem" />
        </div>
      </div>
    </article>
  );
}

function PortfolioCard({
  item,
  onPreview,
}: {
  item: PortfolioItem;
  onPreview: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const coverIndex = normalizeCoverIndex(item.coverIndex, item.imageUrls ?? []);
  const previewImages = useMemo(() => getPortfolioPreviewImages(item), [item]);
  const coverImage = previewImages[coverIndex] ?? item.imageUrl;
  const hasExternalUrl = Boolean(item.websiteUrl && item.websiteUrl !== "#");
  const showImage = coverImage && !imageError;

  return (
    <article className="group h-fit overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-naki-frost">
        {showImage ? (
          <img
            className="h-full w-full object-cover transition duration-300"
            src={coverImage}
            alt={item.title}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-naki-primary/5 to-naki-secondary/5" />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-naki-primary backdrop-blur">
            {item.category}
          </span>
          {previewImages.length > 1 ? (
            <span className="rounded-md bg-naki-primary/85 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
              {previewImages.length} foto
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-naki-primary">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-naki-smoke">
          {item.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-blue-500">
            {item.result}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-naki-primary px-3 text-xs font-medium text-white transition hover:opacity-90"
            onClick={onPreview}
            type="button"
            aria-label={`Preview ${item.title}`}
          >
            <Eye size={14} />
            Preview
          </button>
          {hasExternalUrl ? (
            <a
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
              href={item.websiteUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`View ${item.title}`}
            >
              <ExternalLink size={14} />
              View
            </a>
          ) : (
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-naki-frost px-3 text-xs font-medium text-naki-smoke"
              type="button"
              disabled
              aria-label={`View ${item.title}`}
            >
              <ExternalLink size={14} />
              View
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function PortfolioPreviewModal({
  item,
  onClose,
}: {
  item: PortfolioItem;
  onClose: () => void;
}) {
  const previewImages = useMemo(() => getPortfolioPreviewImages(item), [item]);
  const { photos: albumPhotos, isLoading: albumIsLoading } =
    usePortfolioAlbumPhotos(item.title, previewImages);
  const [fullscreenImage, setFullscreenImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-naki-primary/75 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview portofolio ${item.title}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mx-auto flex w-full max-w-[96rem] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-naki-steel px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              Gallery preview
            </p>
            <h2 className="mt-1 text-2xl font-bold text-naki-primary">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-naki-smoke">
              {item.category} - {previewImages.length} foto
            </p>
          </div>
          <div className="flex items-center gap-2">
            {item.websiteUrl && item.websiteUrl !== "#" ? (
              <a
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                href={item.websiteUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={15} />
                View
              </a>
            ) : (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-naki-frost px-4 text-sm font-medium text-naki-smoke"
                type="button"
                disabled
              >
                <ExternalLink size={15} />
                View
              </button>
            )}
            <button
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-naki-steel text-naki-primary transition hover:border-naki-smoke"
              onClick={onClose}
              type="button"
              aria-label="Tutup preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto bg-naki-page-bg p-3 sm:p-5">
          {previewImages.length > 0 ? (
            albumPhotos.length > 0 && !albumIsLoading ? (
              <MasonryPhotoAlbum
                photos={albumPhotos}
                onClick={({ photo }) => {
                  setFullscreenImage({ src: photo.src, alt: photo.alt ?? item.title });
                }}
                columns={(containerWidth) => {
                  if (containerWidth < 640) return 1;
                  if (containerWidth < 1024) return 2;
                  if (containerWidth < 1440) return 3;
                  return 4;
                }}
                spacing={16}
                padding={0}
                render={{
                  extras: (_props, context) => (
                    <div
                      className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-naki-primary/0 opacity-0 backdrop-blur-[0px] transition duration-300 group-hover:bg-naki-primary/10 group-hover:opacity-100 group-hover:backdrop-blur-sm"
                      data-index={context.index}
                    >
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-naki-primary shadow-lg">
                        <Eye size={16} />
                        View
                      </div>
                    </div>
                  ),
                }}
                componentsProps={{
                  container: {
                    className: "overflow-hidden rounded-2xl",
                  },
                  wrapper: {
                    className:
                      "group relative overflow-hidden rounded-2xl border border-naki-steel bg-white shadow-sm",
                  },
                  image: {
                    className: "block h-full w-full",
                  },
                  button: {
                    className: "group relative overflow-hidden rounded-2xl",
                  },
                }}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {previewImages.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    className="group relative overflow-hidden rounded-2xl border border-naki-steel bg-white shadow-sm"
                    type="button"
                    aria-label={`Buka full screen ${item.title} capture ${index + 1}`}
                    onClick={() => {
                      setFullscreenImage({
                        src: imageUrl,
                        alt: `${item.title} capture ${index + 1}`,
                      });
                    }}
                  >
                    <img
                      className="block h-auto w-full"
                      src={imageUrl}
                      alt={`${item.title} capture ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-naki-primary/0 opacity-0 backdrop-blur-[0px] transition duration-300 group-hover:bg-naki-primary/10 group-hover:opacity-100 group-hover:backdrop-blur-sm">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-naki-primary shadow-lg">
                        <Eye size={16} />
                        View
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-dashed border-naki-steel bg-white p-8 text-center text-sm text-naki-smoke">
              Foto preview belum ditambahkan untuk project ini.
            </div>
          )}
        </div>
      </div>
      {fullscreenImage ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 px-4 py-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} full screen preview`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setFullscreenImage(null);
            }
          }}
        >
          <div className="relative flex max-h-[92vh] max-w-[92vw] items-center justify-center">
            <img
              className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
              src={fullscreenImage.src}
              alt={fullscreenImage.alt}
            />
            <button
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/95 text-naki-primary shadow-lg transition hover:bg-white"
              type="button"
              onClick={() => setFullscreenImage(null)}
              aria-label="Tutup foto full screen"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

function getPortfolioPreviewImages(item: PortfolioItem) {
  const imageUrls =
    item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls.filter(Boolean)
      : item.imageUrl
        ? [item.imageUrl]
        : [];

  return Array.from(new Set(imageUrls.filter(Boolean)));
}

function usePortfolioAlbumPhotos(title: string, imageUrls: string[]) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (imageUrls.length === 0) {
      setPhotos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const loadPhoto = async (src: string, index: number): Promise<Photo> => {
      const naturalSize = await getImageSize(src);

      return {
        src,
        width: naturalSize.width,
        height: naturalSize.height,
        alt: `${title} capture ${index + 1}`,
        label: `${title} capture ${index + 1}`,
        key: `${src}-${index}`,
      };
    };

    void Promise.all(imageUrls.map((src, index) => loadPhoto(src, index)))
      .then((nextPhotos) => {
        if (!cancelled) {
          setPhotos(nextPhotos);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhotos([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrls, title]);

  return { photos, isLoading };
}

function getImageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth || 4,
        height: image.naturalHeight || 5,
      });
    };

    image.onerror = () => {
      resolve({
        width: 4,
        height: 5,
      });
    };

    image.src = src;
  });
}
