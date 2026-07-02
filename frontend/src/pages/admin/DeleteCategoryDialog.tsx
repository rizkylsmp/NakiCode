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
      className="fixed inset-0 z-10000 grid place-items-center bg-naki-primary/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-category-title"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h2
                id="delete-category-title"
                className="text-lg font-bold leading-tight text-naki-primary"
              >
                Hapus "{category}"?
              </h2>
              <p className="mt-1 text-sm text-naki-smoke">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
          <button
            className="grid size-8 shrink-0 place-items-center rounded-lg text-naki-smoke transition hover:text-naki-primary"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 border-t border-naki-steel p-4">
          <button
            className="flex-1 inline-flex h-10 items-center justify-center rounded-xl border border-naki-steel bg-white text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isDeleting}
            onClick={() => onConfirm(category)}
            type="button"
          >
            <Trash2 size={14} />
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
