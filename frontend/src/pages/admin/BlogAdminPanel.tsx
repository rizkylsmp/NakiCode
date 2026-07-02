import { FileText, Image, Plus, Edit2, RefreshCw, Save, Trash2, X, Eye } from "lucide-react";
import { createPortal } from "react-dom";
import { useState } from "react";
import {
  type BlogPostFormState,
  type BlogPostItem,
  adminBlogPostsPageSize,
} from "./AdminTemplateWorkspace.shared";
import { DeleteBlogDialog } from "./DeleteBlogDialog";
import { ImageUploadDropZone } from "./AdminTemplateWorkspace.shared";
import { PaginationControls } from "../../components/PaginationControls";

type BlogAdminPanelProps = {
  posts: BlogPostItem[];
  paginatedPosts: BlogPostItem[];
  totalPosts: number;
  page: number;
  totalPages: number;
  search: string;
  selectedId: number | null;
  status: string;
  isSaving: boolean;
  isModalOpen: boolean;
  deletingId: number | null;
  form: BlogPostFormState;
  adminToken: string | null;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onStartCreate: () => void;
  onStartEdit: (post: BlogPostItem) => void;
  onDelete: (post: BlogPostItem) => void;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onFormChange: (
    field: keyof BlogPostFormState,
    value: string,
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function BlogAdminPanel({
  posts,
  paginatedPosts,
  totalPosts,
  page,
  totalPages,
  search,
  selectedId,
  status,
  isSaving,
  isModalOpen,
  deletingId,
  form,
  adminToken,
  onSearchChange,
  onPageChange,
  onStartCreate,
  onStartEdit,
  onDelete,
  onOpenModal,
  onCloseModal,
  onFormChange,
  onSubmit,
  onConfirmDelete,
  onCancelDelete,
}: BlogAdminPanelProps) {
  const [previewPost, setPreviewPost] = useState<BlogPostItem | null>(null);

  return (
    <div className="bg-naki-page-bg py-8">
      <section className="min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-naki-primary leading-tight">Artikel Blog</h2>
            <p className="mt-1 text-sm text-naki-smoke leading-relaxed">
              {totalPosts} artikel{totalPosts !== 1 ? "" : ""}
            </p>
            {status ? (
              <p className="mt-1 text-sm font-medium text-naki-primary">{status}</p>
            ) : null}
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-medium text-white transition hover:opacity-90"
            onClick={() => {
              onStartCreate();
              onOpenModal();
            }}
            type="button"
          >
            <Plus size={16} />
            Artikel baru
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-naki-smoke">Cari artikel</span>
            <input
              className="h-11 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-blue-400"
              placeholder="Cari judul atau isi artikel..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              type="search"
            />
          </label>
        </div>

        {/* Posts list */}
        {paginatedPosts.length === 0 ? (
          <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-naki-steel bg-white shadow-sm">
            <div className="text-center">
              <FileText size={32} className="mx-auto text-naki-smoke/50" />
              <p className="mt-2 text-sm font-medium text-naki-smoke">
                Belum ada artikel
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedPosts.map((post) => (
              <article
                key={post.id}
                className={`group rounded-2xl bg-white p-4 shadow-sm transition duration-200 sm:p-5 ${
                  selectedId === post.id
                    ? "ring-2 ring-naki-secondary/30"
                    : "hover:shadow-md"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4 min-w-0 flex-1">
                    {post.coverImage && (
                      <div className="shrink-0">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-base font-semibold text-naki-primary">
                          {post.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                            post.status === "published"
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {post.status === "published" ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-naki-smoke">
                        /blog/{post.slug}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-naki-smoke leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-naki-smoke/80">
                        <span>oleh {post.author}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="grid size-10 place-items-center rounded-xl border border-naki-steel bg-white text-naki-smoke transition hover:border-naki-secondary hover:text-naki-secondary"
                      onClick={() => setPreviewPost(post)}
                      type="button"
                      aria-label={`Preview ${post.title}`}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="grid size-10 place-items-center rounded-xl border border-naki-steel bg-white text-naki-smoke transition hover:border-naki-secondary hover:text-naki-secondary"
                      onClick={() => onStartEdit(post)}
                      type="button"
                      aria-label={`Edit ${post.title}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="grid size-10 place-items-center rounded-xl border border-naki-steel bg-white text-naki-smoke transition hover:border-red-400 hover:text-red-500"
                      onClick={() => onDelete(post)}
                      type="button"
                      aria-label={`Hapus ${post.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        <PaginationControls
          page={page}
          total={totalPosts}
          totalPages={totalPages}
          pageSize={adminBlogPostsPageSize}
          onPageChange={onPageChange}
        />
      </section>

      {isModalOpen ? createPortal(
        <div
          className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-form-title"
        >
          <div className="w-full my-10 mx-4 max-w-4xl rounded-2xl bg-white shadow-sm">
            <div className="sticky top-0 z-10 flex flex-col justify-between gap-3 border-b border-naki-steel bg-white/95 p-5 backdrop-blur sm:flex-row sm:items-start">
              <div>
                <h2 id="blog-form-title" className="text-2xl font-bold leading-tight text-naki-primary">
                  {form.id ? "Edit Artikel" : "Artikel Baru"}
                </h2>
                <p className="mt-1 text-sm text-naki-smoke leading-relaxed">
                  Tulis dan publikasikan artikel blog.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-secondary"
                  onClick={onStartCreate}
                  type="button"
                  aria-label="Reset form"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
                  onClick={onCloseModal}
                  type="button"
                  aria-label="Tutup form"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <form className="grid gap-5 p-5" onSubmit={onSubmit}>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-smoke">Judul *</span>
                <input
                  className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                  value={form.title}
                  onChange={(event) => onFormChange("title", event.target.value)}
                  placeholder="Judul artikel"
                  required
                  type="text"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-naki-smoke">Slug</span>
                  <input
                    className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                    value={form.slug}
                    onChange={(event) => onFormChange("slug", event.target.value)}
                    placeholder="auto-dari-judul"
                    type="text"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-naki-smoke">Status</span>
                  <select
                    className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                    value={form.status}
                    onChange={(event) => onFormChange("status", event.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-smoke">Penulis</span>
                <input
                  className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                  value={form.author}
                  onChange={(event) => onFormChange("author", event.target.value)}
                  type="text"
                />
              </label>

              <div className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-smoke">Cover Image</span>
                <ImageUploadDropZone
                  title="Upload gambar cover"
                  description="Pilih gambar untuk cover artikel (max 5MB, min 200x200px)"
                  multiple={false}
                  adminToken={adminToken}
                  onUploaded={(urls) => {
                    if (urls.length > 0) {
                      onFormChange("coverImage", urls[0]);
                    }
                  }}
                  onStatusChange={(msg) => console.log(msg)}
                />
                {form.coverImage && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-naki-steel bg-naki-page-bg p-3">
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-naki-smoke truncate">{form.coverImage}</p>
                      <button
                        type="button"
                        className="mt-1 text-xs text-red-500 hover:text-red-600"
                        onClick={() => onFormChange("coverImage", "")}
                      >
                        Hapus gambar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-smoke">Excerpt *</span>
                <textarea
                  className="resize-y rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm text-naki-primary leading-relaxed outline-none transition focus:border-naki-primary"
                  value={form.excerpt}
                  onChange={(event) => onFormChange("excerpt", event.target.value)}
                  placeholder="Ringkasan singkat artikel..."
                  required
                  rows={3}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-smoke">Konten *</span>
                <textarea
                  className="resize-y rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm text-naki-primary leading-relaxed outline-none transition focus:border-naki-primary"
                  value={form.content}
                  onChange={(event) => onFormChange("content", event.target.value)}
                  placeholder="Tulis konten artikel. Markdown didukung."
                  required
                  rows={12}
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-naki-steel pt-5 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                  onClick={onCloseModal}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
                  disabled={isSaving}
                  type="submit"
                >
                  <Save size={17} />
                  {isSaving ? "Menyimpan..." : form.id ? "Simpan" : "Buat"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      ) : null}

      {/* Preview modal */}
      {previewPost ? createPortal(
        <div
          className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full my-10 mx-4 max-w-4xl rounded-2xl bg-white shadow-sm">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-naki-steel bg-white/95 p-5 backdrop-blur">
              <h2 className="text-2xl font-bold leading-tight text-naki-primary">
                Preview Artikel
              </h2>
              <button
                className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
                onClick={() => setPreviewPost(null)}
                type="button"
                aria-label="Tutup preview"
              >
                <X size={17} />
              </button>
            </div>
            <div className="p-6">
              {previewPost.coverImage && (
                <img
                  src={previewPost.coverImage}
                  alt={previewPost.title}
                  className="mb-6 h-64 w-full rounded-xl object-cover"
                />
              )}
              <h1 className="text-3xl font-bold text-naki-primary mb-2">
                {previewPost.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-naki-smoke mb-6">
                <span>oleh {previewPost.author}</span>
                <span>•</span>
                <span>
                  {new Date(previewPost.publishedAt || previewPost.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-lg text-naki-smoke leading-relaxed mb-6 italic">
                {previewPost.excerpt}
              </p>
              <div className="prose prose-sm max-w-none text-naki-primary leading-relaxed whitespace-pre-wrap">
                {previewPost.content}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      <DeleteBlogDialog
        blog={deletingId !== null ? paginatedPosts.find(p => p.id === deletingId) ?? null : null}
        isDeleting={deletingId !== null}
        onClose={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
