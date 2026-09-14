import { Plus, Edit2, Trash2, X, GripVertical, Tag } from "lucide-react";
import { useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../../services/api-client";
import { getApiErrorMessage } from "../../services/api-client";
import { useToast } from "../../components/ui/Toast";
import type { AdminCategory } from "./AdminTemplateWorkspace.shared";

type CategoryMutationResponse = {
  categories?: string[];
  adminCategories?: AdminCategory[];
  message?: string;
};

type AdminCategoriesSectionProps = {
  adminToken: string | null;
  categories: AdminCategory[];
  isRefreshing?: boolean;
  status?: string;
  onCategoriesChange: (categories: AdminCategory[]) => void;
  onRefresh?: () => void;
};

export function AdminCategoriesSection({
  adminToken,
  categories,
  isRefreshing = false,
  status = "",
  onCategoriesChange,
  onRefresh,
}: AdminCategoriesSectionProps) {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  async function refreshAdminCategories() {
    const data = await apiGet<{ categories: AdminCategory[] }>(
      "/api/categories/admin",
    );
    onCategoriesChange(data.categories ?? []);
  }

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) {
      setError("Login admin diperlukan untuk menyimpan kategori.");
      return;
    }

    const name = categoryName.trim();
    if (name.length < 2) {
      setError("Nama kategori minimal 2 karakter.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (editingCategory) {
        const data = await apiPut<CategoryMutationResponse>(
          `/api/categories/${editingCategory.id}`,
          { name },
        );
        if (Array.isArray(data.adminCategories)) {
          onCategoriesChange(data.adminCategories);
        } else {
          onCategoriesChange(
            categories.map((category) =>
              category.id === editingCategory.id
                ? { ...category, name }
                : category,
            ),
          );
        }
      } else {
        const data = await apiPost<CategoryMutationResponse>(
          "/api/categories",
          { name },
        );
        if (Array.isArray(data.adminCategories)) {
          onCategoriesChange(data.adminCategories);
        }
      }
      await refreshAdminCategories().catch(() => undefined);
      setError("");
      handleCloseModal();
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan kategori."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (category: AdminCategory) => {
    if (category.designCount > 0) {
      toast.addToast(
        "info",
        `Kategori masih dipakai oleh ${category.designCount} design.`,
      );
      return;
    }

    setDeleteTarget(category);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!adminToken || !deleteTarget) return;

    setIsLoading(true);
    try {
      const deletedId = deleteTarget.id;
      const data = await apiDelete<CategoryMutationResponse>(
        `/api/categories/${deleteTarget.id}`,
      );
      if (Array.isArray(data.adminCategories)) {
        onCategoriesChange(data.adminCategories);
      } else {
        onCategoriesChange(
          categories.filter((category) => category.id !== deletedId),
        );
      }
      setError("");
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      toast.addToast("success", "Kategori berhasil dihapus");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Gagal menghapus kategori.");
      if (msg.includes("409") || msg.includes("masih digunakan")) {
        setError(
          `Kategori "${deleteTarget.name}" masih digunakan oleh design. Pindahkan design ke kategori lain terlebih dahulu.`,
        );
      } else {
        setError(msg);
      }
      toast.addToast("error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (!adminToken || draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIndex = categories.findIndex((c) => c.id === draggedId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const newOrder = [...categories];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    // Update UI immediately
    onCategoriesChange(newOrder);

    // Update sort_order in backend
    try {
      const updates = newOrder.map((cat, index) =>
        apiPut(`/api/categories/${cat.id}`, { sort_order: index }),
      );
      await Promise.all(updates);
      toast.addToast("success", "Urutan kategori berhasil diubah");
    } catch {
      toast.addToast("error", "Gagal mengubah urutan kategori");
      // Reload to restore original order
      const data = await apiGet<{ categories: AdminCategory[] }>(
        "/api/categories/admin",
      );
      onCategoriesChange(data.categories);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Kategori</h1>
          <p className="mt-1 text-sm text-naki-smoke">
            Kelola kategori design yang dipakai di katalog.
          </p>
          {status ? (
            <p
              className="mt-2 text-xs font-medium text-naki-smoke"
              aria-live="polite"
            >
              {status}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {onRefresh ? (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-naki-steel bg-white px-4 py-2 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
            >
              {isRefreshing ? "Memuat..." : "Refresh"}
            </button>
          ) : null}
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-naki-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            type="button"
          >
            <Plus size={16} />
            Tambah Kategori
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-naki-steel bg-naki-frost p-3 text-sm text-naki-secondary">
          {error}
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="rounded-xl border border-naki-steel bg-white p-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-naki-steel mb-3" />
          <p className="text-sm text-naki-smoke">
            {isRefreshing ? "Memuat kategori..." : "Belum ada kategori."}
          </p>
          <p className="mt-1 text-xs text-naki-smoke">
            Klik "Tambah Kategori" untuk membuat kategori baru.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, category.id)}
              onDragOver={(e) => handleDragOver(e, category.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, category.id)}
              className={`flex items-center gap-3 rounded-xl border border-naki-steel bg-white p-4 transition cursor-grab active:cursor-grabbing ${
                dragOverId === category.id
                  ? "border-naki-primary border-2 shadow-lg"
                  : draggedId === category.id
                    ? "opacity-50 border-naki-steel"
                    : "hover:border-naki-primary/40"
              }`}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                <GripVertical size={16} />
              </div>
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                <Tag size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-naki-primary">
                  {category.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-naki-smoke">
                  <span>ID: {category.id}</span>
                  <span aria-hidden="true">•</span>
                  <span className="group/usage relative">
                    <span
                      aria-describedby={
                        category.designCount > 0
                          ? `category-designs-${category.id}`
                          : undefined
                      }
                      className={`inline-flex rounded-full px-2 py-0.5 font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-naki-secondary focus-visible:ring-offset-2 ${
                        category.designCount > 0
                          ? "cursor-help bg-blue-50 text-blue-700"
                          : "bg-naki-frost text-naki-smoke"
                      }`}
                      tabIndex={category.designCount > 0 ? 0 : undefined}
                    >
                      {category.designCount} Design
                    </span>
                    {category.designCount > 0 ? (
                      <span
                        className="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 w-max max-w-[min(20rem,calc(100vw-3rem))] translate-y-1 rounded-xl border border-naki-steel bg-white p-3 text-left text-xs font-medium text-naki-primary opacity-0 shadow-naki-card transition duration-150 group-hover/usage:visible group-hover/usage:translate-y-0 group-hover/usage:opacity-100 group-focus-within/usage:visible group-focus-within/usage:translate-y-0 group-focus-within/usage:opacity-100"
                        id={`category-designs-${category.id}`}
                        role="tooltip"
                      >
                        <span className="grid gap-1.5">
                          {(category.designTitles ?? []).map((title, index) => (
                            <span
                              className="block"
                              key={`${title}-${index}`}
                            >
                              {title}
                            </span>
                          ))}
                        </span>
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(category)}
                  className="grid size-9 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  disabled={category.designCount > 0}
                  className="grid size-9 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={
                    category.designCount > 0
                      ? `Tidak dapat menghapus ${category.name}; masih dipakai oleh ${category.designCount} design`
                      : `Hapus kategori ${category.name}`
                  }
                  title={
                    category.designCount > 0
                      ? `Tidak dapat dihapus karena masih dipakai oleh ${category.designCount} design`
                      : "Hapus kategori"
                  }
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-naki-primary/40 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-naki-card">
            <div className="flex items-center justify-between border-b border-naki-steel p-5">
              <h2 className="text-lg font-bold text-naki-primary">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="grid size-9 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-naki-primary mb-1.5">
                  Nama Kategori <span className="text-naki-secondary">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2.5 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                  placeholder="Contoh: Portfolio"
                  required
                />
              </div>
              {error && (
                <div className="rounded-lg bg-naki-frost p-3 text-sm text-naki-secondary">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg bg-naki-primary px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading
                    ? "Menyimpan..."
                    : editingCategory
                      ? "Update"
                      : "Buat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && deleteTarget && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-naki-primary/40 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-naki-card">
            <div className="p-5">
              <h2 className="text-lg font-bold text-naki-primary">
                Hapus Kategori?
              </h2>
              <p className="mt-2 text-sm text-naki-smoke">
                Kategori{" "}
                <span className="font-semibold text-naki-primary">
                  "{deleteTarget.name}"
                </span>{" "}
                akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setDeleteTarget(null);
                  }}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg bg-naki-secondary px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
