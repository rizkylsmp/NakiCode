import { Plus, Edit2, Trash2, X, GripVertical, Tag } from "lucide-react";
import { useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../../api-client";
import { getApiErrorMessage } from "../../api-client";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithId | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithId | null>(null);

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
    } catch (err) {
      const msg = getApiErrorMessage(err, "Gagal menghapus kategori.");
      if (msg.includes("409") || msg.includes("masih digunakan")) {
        setError(
          `Kategori "${deleteTarget.name}" masih digunakan oleh template. Pindahkan template ke kategori lain terlebih dahulu.`
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage template categories used in the catalog.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No categories yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Click "Add Category" to create one.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-400">
                <Tag size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-400">ID: {category.id}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(category)}
                  className="grid size-9 place-items-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="grid size-9 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
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
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="grid size-9 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Portfolio"
                  required
                />
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
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
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-lg">
            <div className="p-5">
              <h2 className="text-lg font-bold text-gray-900">Delete Category?</h2>
              <p className="mt-2 text-sm text-gray-500">
                Category <span className="font-semibold text-gray-900">"{deleteTarget.name}"</span> will be permanently deleted. This action cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
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
