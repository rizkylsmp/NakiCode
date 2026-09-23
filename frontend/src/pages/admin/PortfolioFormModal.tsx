import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  GripVertical,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type React from "react";
import { createPortal } from "react-dom";
import {
  Field,
  ImageUploadDropZone,
  TextArea,
  normalizeCoverIndex,
  type PortfolioFormState,
} from "./AdminDesignWorkspace.shared";

type PortfolioFormModalProps = {
  adminToken: string | null;
  categoryOptions: string[];
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
  categoryOptions,
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
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null,
  );
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setImageStatus("Upload, drop, atau paste satu foto portofolio.");
      setPreviewImageError(false);
      setDraggedImageIndex(null);
      setDragTargetIndex(null);
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
  const storedPortfolioImages =
    form.imageUrls.length > 0
      ? form.imageUrls
      : form.imageUrl.trim()
        ? [form.imageUrl.trim()]
        : [];
  const storedCoverIndex = normalizeCoverIndex(
    form.coverIndex,
    storedPortfolioImages,
  );
  const portfolioImages =
    storedCoverIndex > 0
      ? [
          storedPortfolioImages[storedCoverIndex],
          ...storedPortfolioImages.filter(
            (_, imageIndex) => imageIndex !== storedCoverIndex,
          ),
        ]
      : storedPortfolioImages;
  const coverImage = portfolioImages[0] ?? "";
  const hasImage = Boolean(coverImage);
  const registeredCategories = Array.from(
    new Set(categoryOptions.map((category) => category.trim()).filter(Boolean)),
  );
  const currentCategory = form.category.trim();
  const hasLegacyCategory =
    Boolean(currentCategory) && !registeredCategories.includes(currentCategory);

  function updatePortfolioImages(
    imageUrls: string[],
    nextIndex = 0,
  ) {
    const nextCoverIndex = normalizeCoverIndex(nextIndex, imageUrls);

    onUpdateField("imageUrls", imageUrls);
    onUpdateField("coverIndex", nextCoverIndex);
    onUpdateField("imageUrl", imageUrls[nextCoverIndex] ?? "");
  }

  function handleThumbnailDelete(imageIndex: number) {
    const newImages = portfolioImages.filter((_, i) => i !== imageIndex);
    updatePortfolioImages(newImages, 0);
    setPreviewImageError(false);
    setImageStatus(
      imageIndex === 0
        ? "Foto cover dihapus. Foto berikutnya otomatis menjadi cover."
        : `Foto posisi ${imageIndex + 1} dihapus dari form.`,
    );
  }

  function movePortfolioImage(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= portfolioImages.length ||
      toIndex >= portfolioImages.length
    ) {
      return;
    }

    const nextImages = [...portfolioImages];
    const [movedImage] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, movedImage);
    updatePortfolioImages(nextImages, 0);
    setPreviewImageError(false);
    setImageStatus(
      toIndex === 0
        ? "Urutan foto diperbarui. Foto paling atas menjadi cover."
        : `Foto dipindahkan ke posisi ${toIndex + 1}.`,
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/45 p-0 backdrop-blur sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-form-title"
    >
      <div className="min-h-dvh w-full overflow-hidden bg-white shadow-sm sm:my-10 sm:min-h-0 sm:max-w-7xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex flex-col justify-between gap-3 border-b border-naki-steel bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-medium uppercase text-naki-secondary">
              Portfolio admin
            </p>
            <h2
              id="portfolio-form-title"
              className="mt-1 text-2xl font-bold leading-tight text-naki-primary"
            >
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
          className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_360px]"
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
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-naki-smoke">
                  Kategori
                </span>
                <select
                  aria-label="Kategori"
                  className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={registeredCategories.length === 0 && !hasLegacyCategory}
                  onChange={(event) =>
                    onUpdateField("category", event.target.value)
                  }
                  required
                  value={form.category}
                >
                  <option disabled value="">
                    Pilih kategori
                  </option>
                  {hasLegacyCategory ? (
                    <option value={currentCategory}>
                      {currentCategory} (kategori lama)
                    </option>
                  ) : null}
                  {registeredCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {registeredCategories.length === 0 ? (
                  <span className="text-xs text-naki-smoke">
                    Tambahkan kategori terlebih dahulu melalui menu Kategori.
                  </span>
                ) : null}
              </label>
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
                <ol
                  aria-label="Urutan foto portofolio"
                  className="grid gap-2 p-3"
                >
                  {portfolioImages.map((imageUrl, index) => (
                    <ThumbnailImageWrapper
                      key={`${imageUrl}-${index}`}
                      imageUrl={imageUrl}
                      title={previewTitle}
                      index={index}
                      isCover={index === 0}
                      isDragging={draggedImageIndex === index}
                      isDragTarget={
                        dragTargetIndex === index && draggedImageIndex !== index
                      }
                      canMoveUp={index > 0}
                      canMoveDown={index < portfolioImages.length - 1}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", String(index));
                        setDraggedImageIndex(index);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragTargetIndex(index);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const sourceIndex =
                          draggedImageIndex ??
                          Number(event.dataTransfer.getData("text/plain"));
                        movePortfolioImage(sourceIndex, index);
                        setDraggedImageIndex(null);
                        setDragTargetIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedImageIndex(null);
                        setDragTargetIndex(null);
                      }}
                      onMoveUp={() => movePortfolioImage(index, index - 1)}
                      onMoveDown={() => movePortfolioImage(index, index + 1)}
                      onDelete={() => handleThumbnailDelete(index)}
                    />
                  ))}
                </ol>
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

function ThumbnailImageWrapper({
  imageUrl,
  title,
  index,
  isCover,
  isDragging,
  isDragTarget,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  imageUrl: string;
  title: string;
  index: number;
  isCover: boolean;
  isDragging: boolean;
  isDragTarget: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDragStart: (event: React.DragEvent<HTMLLIElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLLIElement>) => void;
  onDrop: (event: React.DragEvent<HTMLLIElement>) => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <li
      aria-label={`Foto ${index + 1}${isCover ? ", cover" : ""}`}
      className={`grid cursor-grab grid-cols-[auto_5.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border bg-white p-2 shadow-sm transition active:cursor-grabbing sm:grid-cols-[auto_6.5rem_minmax(0,1fr)_auto] ${
        isDragTarget
          ? "border-naki-secondary ring-2 ring-naki-secondary/20"
          : "border-naki-steel"
      } ${isDragging ? "opacity-45" : "opacity-100"}`}
      draggable
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center text-naki-smoke"
      >
        <GripVertical size={18} />
      </span>
      <div className="relative h-16 overflow-hidden rounded-lg bg-naki-frost sm:h-20">
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
        {isCover ? (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-naki-primary px-2 py-1 text-[10px] font-medium text-white">
            Cover
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-naki-primary">
          Foto {index + 1}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-naki-smoke">
          {isCover
            ? "Foto paling atas digunakan sebagai cover."
            : "Drag untuk mengubah urutan foto."}
        </p>
      </div>
      <div className="col-span-3 flex justify-end gap-1 border-t border-naki-steel pt-2 sm:col-span-1 sm:border-0 sm:pt-0">
        <button
          aria-label={`Naikkan foto ${index + 1}`}
          className="grid size-8 place-items-center rounded-lg text-naki-secondary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          type="button"
        >
          <ArrowUp size={14} />
        </button>
        <button
          aria-label={`Turunkan foto ${index + 1}`}
          className="grid size-8 place-items-center rounded-lg text-naki-secondary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          type="button"
        >
          <ArrowDown size={14} />
        </button>
        <button
          aria-label={`Hapus foto ${index + 1}`}
          className="grid size-8 place-items-center rounded-lg text-naki-smoke transition hover:bg-red-50 hover:text-red-500"
          onClick={onDelete}
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    </li>
  );
}
