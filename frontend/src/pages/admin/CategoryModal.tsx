import { Check, Edit3, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import { createPortal } from "react-dom";
import { type TemplateCategory } from "../../content";
import { Field } from "./AdminTemplateWorkspace.shared";

type CategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  categoryName: string;
  onCategoryNameChange: (value: string) => void;
  isSavingCategory: boolean;
  categoryOptions: TemplateCategory[];
  editingCategory: TemplateCategory | null;
  editingCategoryName: string;
  onEditCategoryNameChange: (value: string) => void;
  onEditCategory: (category: TemplateCategory) => void;
  onSaveEditCategory: () => void;
  onCancelEditCategory: () => void;
  onDeleteCategory: (category: TemplateCategory) => void;
};

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categoryName,
  onCategoryNameChange,
  isSavingCategory,
  categoryOptions,
  editingCategory,
  editingCategoryName,
  onEditCategoryNameChange,
  onEditCategory,
  onSaveEditCategory,
  onCancelEditCategory,
  onDeleteCategory,
}: CategoryModalProps) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <div className="w-full my-10 mx-4 max-w-3xl rounded-2xl bg-white shadow-sm">
        <div className="sticky top-0 z-10 flex flex-col justify-between gap-3 border-b border-naki-steel bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-start">
          <div>
            <h2 id="category-modal-title" className="text-2xl font-bold leading-tight text-naki-primary">
              Kelola Kategori
            </h2>
            <p className="mt-1 text-sm text-naki-smoke leading-relaxed">
              Tambah, edit, atau hapus kategori template.
            </p>
          </div>
          <button
            className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
            onClick={onClose}
            type="button"
            aria-label="Tutup modal"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Field
              label="Nama Kategori Baru"
              value={categoryName}
              onChange={onCategoryNameChange}
              required
            />
            <button
              type="submit"
              disabled={isSavingCategory || !categoryName.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
            >
              <Plus size={16} />
              {isSavingCategory ? "Menyimpan..." : "Tambah Kategori"}
            </button>
          </form>

          <div className="border-t border-naki-steel pt-4">
            <h3 className="text-lg font-bold text-naki-primary mb-3">Kategori yang Ada</h3>
            {categoryOptions.length === 0 ? (
              <p className="text-sm text-naki-smoke">Belum ada kategori.</p>
            ) : (
              <div className="space-y-2">
                {categoryOptions.map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between rounded-xl bg-naki-frost p-3"
                  >
                    {editingCategory === category ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => onEditCategoryNameChange(e.target.value)}
                          className="flex-1 rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm text-naki-primary outline-none transition focus:border-blue-400"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={onSaveEditCategory}
                          className="grid size-9 place-items-center rounded-lg bg-naki-primary text-white transition hover:opacity-90"
                          aria-label="Simpan"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={onCancelEditCategory}
                          className="grid size-9 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-smoke"
                          aria-label="Batal"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-naki-primary">{category}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditCategory(category)}
                            className="grid size-9 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-secondary"
                            aria-label="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(category)}
                            className="grid size-9 place-items-center rounded-lg border border-naki-steel bg-white text-naki-smoke transition hover:border-red-400 hover:text-red-500"
                            aria-label="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
