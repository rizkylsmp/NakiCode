import { Plus, Edit2, Trash2, X, GripVertical, Tag } from "lucide-react";
import { useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../../api-client";
import { getApiErrorMessage } from "../../api-client";
import { useToast } from "../../components/Toast";

type CategoryWithId = { id: number; name: string };

type AdminCategoriesSectionProps = {
  adminToken: string | null;
  categories: CategoryWithId[];
  onCategoriesChange: (categories: CategoryWithId[]) => void;
};

export function AdminCategoriesSection({
  adminToken,
  categories,
  onCategoriesChange,
}: AdminCategoriesSectionProps) {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithId | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithId | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: CategoryWithId) => {
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
    if (!adminToken) return;

    const name = categoryName.trim();
    if (name.length < 2) {
      setError("Nama kategori minimal 2 karakter.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (editingCategory) {
        const data = await apiPut<{ categories: CategoryWithId[]; message?: string }>(
          `/api/categories/${editingCategory.id}`,
          { name }
        );
        onCategoriesChange(data.categories);
      } else {
        const data = await apiPost<{ categories: CategoryWithId[]; message?: string }>(
          "/api/categories",
          { name }
        );
        onCategoriesChange(data.categories);
      }
      handleCloseModal();
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan kategori."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (category: CategoryWithId) => {
    setDeleteTarget(category);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!adminToken || !deleteTarget) return;

    setIsLoading(true);
    try {
      const data = await apiDelete<{ categories: CategoryWithId[]; message?: string }>(
        `/api/categories/${deleteTarget.id}`
      );
      onCategoriesChange(data.categories);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      toast.addToast('success', 'Kategori berhasil dihapus');
    } catch (err) {
      const msg = getApiErrorMessage(err, "Gagal menghapus kategori.");
      if (msg.includes("409") || msg.includes("masih digunakan")) {
        setError(
          `Kategori "${deleteTarget.name}" masih digunakan oleh template. Pindahkan template ke kategori lain terlebih dahulu.`
        );
      } else {
        setError(msg);
      }
      toast.addToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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

    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);

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
        apiPut(`/api/categories/${cat.id}`, { sort_order: index })
      );
      await Promise.all(updates);
      toast.addToast('success', 'Urutan kategori berhasil diubah');
    } catch (err) {
      toast.addToast('error', 'Gagal mengubah urutan kategori');
      // Reload to restore original order
      const data = await apiGet<{ categories: CategoryWithId[] }>("/api/categories/admin");
      onCategoriesChange(data.categories);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Categories</h1>
          <p className="mt-1 text-sm text-naki-smoke">
            Manage template categories used in the catalog.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-naki-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          Add Category
        </button>
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
          <p className="text-sm text-naki-smoke">No categories yet.</p>
          <p className="mt-1 text-xs text-naki-smoke">
            Click "Add Category" to create one.
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
                  ? 'border-naki-primary border-2 shadow-lg'
                  : draggedId === category.id
                  ? 'opacity-50 border-naki-steel'
                  : 'hover:border-naki-primary/40'
              }`}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                <GripVertical size={16} />
              </div>
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                <Tag size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-naki-primary">{category.name}</p>
                <p className="text-xs text-naki-smoke">ID: {category.id}</p>
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
                  className="grid size-9 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-secondary"
                  title="Delete"
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
          className="fixed inset-0 z-9999 flex items-center justify-center bg-naki-primary/40 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-naki-card">
            <div className="flex items-center justify-between border-b border-naki-steel p-5">
              <h2 className="text-lg font-bold text-naki-primary">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="grid size-9 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-naki-primary mb-1.5">
                  Category Name <span className="text-naki-secondary">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2.5 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                  placeholder="e.g. Portfolio"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg bg-naki-primary px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && deleteTarget && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-naki-primary/40 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-naki-card">
            <div className="p-5">
              <h2 className="text-lg font-bold text-naki-primary">Delete Category?</h2>
              <p className="mt-2 text-sm text-naki-smoke">
                Category <span className="font-semibold text-naki-primary">"{deleteTarget.name}"</span> will be permanently deleted. This action cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg bg-naki-secondary px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
