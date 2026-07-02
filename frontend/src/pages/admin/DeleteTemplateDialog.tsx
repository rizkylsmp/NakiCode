import { AlertTriangle, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { type TemplateItem } from "../../content";

type DeleteTemplateDialogProps = {
  template: TemplateItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (template: TemplateItem) => void;
};

export function DeleteTemplateDialog({
  template,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteTemplateDialogProps) {
  if (!template || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-130 grid place-items-center bg-naki-primary/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-template-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-naki-steel bg-naki-frost p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-naki-primary text-white">
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="text-xs font-medium uppercase text-naki-smoke">
                Validasi hapus template
              </p>
              <h2
                id="delete-template-title"
                className="mt-1 text-2xl font-bold leading-tight text-naki-primary"
              >
                Hapus template "{template.title}"?
              </h2>
            </div>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
            aria-label="Tutup dialog hapus template"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <p className="text-sm leading-relaxed text-naki-smoke">
            Template ini akan dihapus dari katalog. Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="grid gap-2 rounded-xl bg-naki-frost p-3">
            <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:items-center">
              <p className="text-xs font-medium uppercase text-naki-smoke">Kategori</p>
              <p className="min-w-0 truncate text-sm font-medium text-naki-primary">
                {template.category}
              </p>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:items-center">
              <p className="text-xs font-medium uppercase text-naki-smoke">Slug</p>
              <p className="min-w-0 truncate text-sm font-medium text-naki-primary">
                {template.slug}
              </p>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:items-center">
              <p className="text-xs font-medium uppercase text-naki-smoke">Harga</p>
              <p className="min-w-0 truncate text-sm font-medium text-naki-primary">
                {template.price}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700">
            <strong>Perhatian:</strong> Template yang sudah dihapus tidak dapat dikembalikan.
            Pastikan template ini tidak sedang digunakan oleh order aktif.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-naki-steel bg-naki-frost p-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:text-naki-smoke"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
            disabled={isDeleting}
            onClick={() => onConfirm(template)}
            type="button"
          >
            <Trash2 size={16} />
            {isDeleting ? "Menghapus..." : "Ya, hapus template"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
