import { BadgeCheck, Check, RefreshCw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type React from "react";
import { createPortal } from "react-dom";
import {
  Field,
  ImageUploadDropZone,
  TextArea,
  normalizeCoverIndex,
  type PortfolioFormState,
} from "./AdminTemplateWorkspace.shared";

type PortfolioFormModalProps = {
  adminToken: string | null;
  form: PortfolioFormState;
  isOpen: boolean;
  isSaving: boolean;
  status: string;
  onClose: () => void;
  onReset: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: <Key extends keyof PortfolioFormState>(
    key: Key,
    value: PortfolioFormState[Key],
  ) => void;
};

export function PortfolioFormModal({
  adminToken,
  form,
  isOpen,
  isSaving,
  status,
  onClose,
  onReset,
  onSubmit,
  onUpdateField,
}: PortfolioFormModalProps) {
  const [imageStatus, setImageStatus] = useState(
    "Upload, drop, atau paste satu foto portofolio.",
  );
  const [previewImageError, setPreviewImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setImageStatus("Upload, drop, atau paste satu foto portofolio.");
      setPreviewImageError(false);
    }
  }, [form.id, isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const modalTitle = form.id ? "Edit portofolio" : "Tambah portofolio";
  const previewTitle = form.title.trim() || "Nama website";
  const previewCategory = form.category.trim() || "Kategori";
  const previewDescription =
    form.description.trim() ||
    "Deskripsi singkat website yang sudah selesai dibuat.";
  const previewResult = form.result.trim() || "Hasil project";
  const portfolioImages =
    form.imageUrls.length > 0
      ? form.imageUrls
      : form.imageUrl.trim()
        ? [form.imageUrl.trim()]
        : [];
  const coverIndex = normalizeCoverIndex(form.coverIndex, portfolioImages);
  const coverImage = portfolioImages[coverIndex] ?? "";
  const hasImage = Boolean(coverImage);

  function updatePortfolioImages(imageUrls: string[], nextIndex = form.coverIndex) {
    const nextCoverIndex = normalizeCoverIndex(nextIndex, imageUrls);

    onUpdateField("imageUrls", imageUrls);
    onUpdateField("coverIndex", nextCoverIndex);
    onUpdateField("imageUrl", imageUrls[nextCoverIndex] ?? "");
  }

  function handleThumbnailDelete(imageIndex: number) {
    const newImages = portfolioImages.filter((_, i) => i !== imageIndex);
    const adjustedCoverIndex =
      imageIndex === coverIndex
        ? 0
        : imageIndex < coverIndex
          ? coverIndex - 1
          : coverIndex;
    updatePortfolioImages(newImages, adjustedCoverIndex);
    setImageStatus(`Foto posisi ${imageIndex + 1} dihapus dari form.`);
  }

  function handleSetCover(imageIndex: number) {
    onUpdateField("coverIndex", imageIndex);
    onUpdateField("imageUrl", portfolioImages[imageIndex]);
    setImageStatus(`Foto posisi ${imageIndex + 1} dijadikan cover.`);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/45 px-4 py-6 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-form-title"
    >
      <div className="my-10 w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="sticky top-0 z-10 flex flex-col justify-between gap-3 border-b border-naki-steel bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-medium uppercase text-naki-secondary">
              Portfolio admin
            </p>
            <h2 id="portfolio-form-title" className="mt-1 text-2xl font-bold leading-tight text-naki-primary">
              {modalTitle}
            </h2>
            <p className="mt-1 text-sm text-naki-smoke leading-relaxed">
              Simpan website yang sudah jadi agar tampil di storefront.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-secondary"
              onClick={onReset}
              type="button"
              aria-label="Reset form portofolio"
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
              disabled={isSaving}
              onClick={onClose}
              type="button"
              aria-label="Tutup form portofolio"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <form
          className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_360px]"
          onSubmit={onSubmit}
        >
          <div className="grid gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-naki-frost px-3 py-2 text-sm font-medium text-naki-primary">
              <BadgeCheck size={16} />
              {status}
            </span>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Nama website"
                value={form.title}
                onChange={(value) => onUpdateField("title", value)}
                required
              />
              <Field
                label="Kategori"
                value={form.category}
                onChange={(value) => onUpdateField("category", value)}
                required
              />
              <Field
                label="Hasil"
                value={form.result}
                onChange={(value) => onUpdateField("result", value)}
                required
              />
              <Field
                label="URL website"
                value={form.websiteUrl}
                onChange={(value) => onUpdateField("websiteUrl", value)}
              />
            </div>

            <TextArea
              label="Deskripsi"
              value={form.description}
              onChange={(value) => onUpdateField("description", value)}
              rows={4}
              required
            />

            <ImageUploadDropZone
              adminToken={adminToken}
              title="Upload / drop / paste foto portofolio"
              description="Bisa upload beberapa gambar. Foto pertama dipakai sebagai cover kartu."
              multiple
              status={imageStatus}
              uploadLabel={hasImage ? "Tambah foto" : "Upload foto"}
              onStatusChange={setImageStatus}
              onUploaded={(imageUrls) => {
                updatePortfolioImages([...portfolioImages, ...imageUrls]);
              }}
              successMessage={(imageUrls) =>
                `${imageUrls.length} foto portofolio berhasil diupload.`
              }
            />

            {hasImage ? (
              <div className="overflow-hidden rounded-xl bg-naki-frost">
                <div className="flex items-center justify-between gap-3 border-b border-naki-steel px-3 py-2">
                  <p className="text-sm font-medium text-naki-primary">
                    Foto terpilih ({portfolioImages.length})
                  </p>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:border-red-400 hover:text-red-500"
                    onClick={() => {
                      updatePortfolioImages([]);
                      setImageStatus(
                        "Semua foto portofolio dihapus dari form.",
                      );
                    }}
                    type="button"
                  >
                    <X size={13} />
                    Hapus semua
                  </button>
                </div>
                <div className="grid gap-3 p-3 sm:grid-cols-2 md:grid-cols-3">
                  {portfolioImages.map((imageUrl, index) => (
                    <ThumbnailImageWrapper
                      key={`${imageUrl}-${index}`}
                      imageUrl={imageUrl}
                      title={previewTitle}
                      index={index}
                      coverIndex={coverIndex}
                      onSetCover={() => handleSetCover(index)}
                      onDelete={() => handleThumbnailDelete(index)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="grid content-start gap-4">
            <div className="overflow-hidden rounded-xl bg-naki-frost shadow-sm">
              <div className="relative flex h-52 items-end overflow-hidden bg-naki-primary p-4 text-white">
                {hasImage && !previewImageError ? (
                  <>
                    <img
                      className="absolute inset-0 h-full w-full object-cover"
                      src={coverImage}
                      alt={previewTitle}
                      loading="lazy"
                      decoding="async"
                      onError={() => setPreviewImageError(true)}
                    />
                    <span className="absolute inset-0 bg-naki-primary/62" />
                  </>
                ) : (
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent),radial-gradient(circle_at_top_right,rgba(240,244,245,0.2),transparent_40%)]" />
                )}
                <div className="relative min-w-0">
                  <p className="text-xs font-medium uppercase text-white/80">
                    {previewCategory}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-2xl font-bold leading-tight text-white">
                    {previewTitle}
                  </h3>
                </div>
              </div>
              <div className="grid gap-3 p-4">
                <p className="line-clamp-3 text-sm leading-relaxed text-naki-smoke">
                  {previewDescription}
                </p>
                <p className="rounded-xl bg-naki-page-bg px-3 py-2.5 text-sm font-medium text-naki-primary">
                  {previewResult}
                </p>
              </div>
            </div>

            <div className="grid gap-2 rounded-xl bg-naki-frost p-4">
              <p className="text-xs font-medium uppercase text-naki-smoke">
                Website URL
              </p>
              <p className="break-all text-sm font-medium text-naki-primary">
                {form.websiteUrl.trim() || "Belum diisi"}
              </p>
            </div>

            <div className="grid gap-2 border-t border-naki-steel pt-4">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
                disabled={isSaving}
                type="submit"
              >
                <Save size={17} />
                {isSaving ? "Menyimpan..." : "Simpan portofolio"}
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:text-naki-smoke"
                disabled={isSaving}
                onClick={onClose}
                type="button"
              >
                Batal
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// Wrapper component that accepts handler props
function ThumbnailImageWrapper({
  imageUrl,
  title,
  index,
  coverIndex,
  onSetCover,
  onDelete,
}: {
  imageUrl: string;
  title: string;
  index: number;
  coverIndex: number;
  onSetCover: () => void;
  onDelete: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="relative h-32 overflow-hidden bg-naki-frost">
        {imageError ? (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-naki-primary/10 to-naki-secondary/10 text-xs text-naki-smoke">
            No image
          </div>
        ) : (
          <img
            className="h-full w-full object-cover"
            src={imageUrl}
            alt={`${title} ${index + 1}`}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
          />
        )}
        {index === coverIndex ? (
          <span className="absolute left-2 top-2 rounded-lg bg-naki-primary px-2 py-1 text-xs font-medium text-white">
            Cover
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 border-t border-naki-steel">
        <button
          className="flex h-9 items-center justify-center gap-1 text-xs font-medium text-naki-secondary transition hover:text-naki-primary disabled:cursor-not-allowed disabled:text-naki-smoke"
          disabled={index === coverIndex}
          onClick={onSetCover}
          type="button"
        >
          <Check size={13} />
          Cover
        </button>
        <button
          className="flex h-9 items-center justify-center gap-1 border-l border-naki-steel text-xs font-medium text-naki-secondary transition hover:text-naki-primary"
          onClick={onDelete}
          type="button"
        >
          <X size={13} />
          Hapus
        </button>
      </div>
    </div>
  );
}
