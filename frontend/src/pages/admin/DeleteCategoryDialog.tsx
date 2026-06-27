import { AlertTriangle, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";

type DeleteCategoryDialogProps = {
  category: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (category: string) => void;
};

export function DeleteCategoryDialog({
  category,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteCategoryDialogProps) {
  if (!category || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-130 grid place-items-center bg-naki-primary/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-category-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-naki-steel bg-naki-frost p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-naki-primary text-white">
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="text-xs font-medium uppercase text-naki-smoke">
                Validasi hapus kategori
              </p>
              <h2
                id="delete-category-title"
                className="mt-1 text-2xl font-bold leading-tight text-naki-primary"
              >
                Hapus kategori "{category}"?
              </h2>
            </div>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
            aria-label="Tutup dialog hapus kategori"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <p className="text-sm leading-relaxed text-naki-smoke">
            Kategori ini akan dihapus dari katalog template. Template yang menggunakan
            kategori ini tidak akan terhapus, namun perlu dipindahkan ke kategori lain.
          </p>

          <div className="rounded-xl bg-naki-frost px-3 py-2.5 text-xs leading-relaxed text-naki-smoke">
            Kategori yang sedang dipakai oleh template tidak dapat dihapus. Pindahkan
            terlebih dahulu template ke kategori lain jika ingin menghapus kategori ini.
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
            disabled={isDeleting}
            onClick={() => onConfirm(category)}
            type="button"
          >
            <Trash2 size={16} />
            {isDeleting ? "Menghapus..." : "Ya, hapus kategori"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
