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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Blog</h1>
          <p className="mt-1 text-sm text-naki-smoke">
            {totalPosts} article{totalPosts !== 1 ? "s" : ""}
          </p>
          {status && (
            <p className="mt-1 text-sm font-medium text-naki-primary">{status}</p>
          )}
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-naki-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          onClick={() => {
            onStartCreate();
            onOpenModal();
          }}
          type="button"
        >
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-naki-steel bg-white p-4 shadow-sm">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-naki-smoke">Search articles</span>
          <input
            className="h-10 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
            placeholder="Search by title or content..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            type="search"
          />
        </label>
      </div>

      {/* Posts list */}
      {paginatedPosts.length === 0 ? (
        <div className="grid min-h-48 place-items-center rounded-xl border-2 border-dashed border-naki-steel bg-white">
          <div className="text-center">
            <FileText size={32} className="mx-auto text-naki-steel" />
            <p className="mt-2 text-sm font-medium text-naki-smoke">
              No articles yet
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-naki-steel bg-white shadow-sm overflow-hidden">
            {paginatedPosts.map((post, index) => (
              <article
                key={post.id}
                className={`flex items-center gap-4 px-6 py-4 transition ${
                  index !== paginatedPosts.length - 1 ? "border-b border-naki-steel" : ""
                } ${
                  selectedId === post.id
                    ? "bg-naki-frost"
                    : "hover:bg-naki-frost"
                }`}
              >
                {post.coverImage && (
                  <div className="shrink-0">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-naki-primary">
                      {post.title}
                    </p>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                        post.status === "published"
                          ? "bg-naki-frost text-naki-primary"
                          : "bg-naki-frost text-naki-secondary"
                      }`}
                    >
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-naki-smoke">
                    /blog/{post.slug}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-naki-smoke">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="grid size-8 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
                    onClick={() => setPreviewPost(post)}
                    type="button"
                    aria-label={`Preview ${post.title}`}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    className="grid size-8 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
                    onClick={() => onStartEdit(post)}
                    type="button"
                    aria-label={`Edit ${post.title}`}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="grid size-8 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-secondary"
                    onClick={() => onDelete(post)}
                    type="button"
                    aria-label={`Hapus ${post.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <PaginationControls
            page={page}
            total={totalPosts}
            totalPages={totalPages}
            pageSize={adminBlogPostsPageSize}
            onPageChange={onPageChange}
          />
        </>
      )}

      {isModalOpen ? createPortal(
        <div
          className="fixed inset-0 z-9999 flex items-start justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-form-title"
        >
          <div className="w-full my-10 mx-4 max-w-4xl rounded-2xl bg-white shadow-naki-card">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-naki-steel bg-white p-5">
              <div>
                <h2 id="blog-form-title" className="text-xl font-bold text-naki-primary">
                  {form.id ? "Edit Article" : "New Article"}
                </h2>
                <p className="mt-1 text-sm text-naki-smoke">
                  Write and publish blog articles.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="grid size-9 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost"
                  onClick={onStartCreate}
                  type="button"
                  aria-label="Reset form"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  className="grid size-9 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost"
                  onClick={onCloseModal}
                  type="button"
                  aria-label="Close form"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <form className="p-5 space-y-5" onSubmit={onSubmit}>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-primary">Title *</span>
                <input
                  className="h-10 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                  value={form.title}
                  onChange={(event) => onFormChange("title", event.target.value)}
                  placeholder="Article title"
                  required
                  type="text"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-naki-primary">Slug</span>
                  <input
                    className="h-10 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                    value={form.slug}
                    onChange={(event) => onFormChange("slug", event.target.value)}
                    placeholder="auto-from-title"
                    type="text"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-naki-primary">Status</span>
                  <select
                    className="h-10 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                    value={form.status}
                    onChange={(event) => onFormChange("status", event.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-primary">Author</span>
                <input
                  className="h-10 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary"
                  value={form.author}
                  onChange={(event) => onFormChange("author", event.target.value)}
                  type="text"
                />
              </label>

              <div className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-primary">Cover Image</span>
                <ImageUploadDropZone
                  title="Upload cover image"
                  description="Select an image for the article cover (max 5MB, min 200x200px)"
                  status={status}
                  multiple={false}
                  adminToken={adminToken}
                  onUploaded={(urls) => {
                    if (urls.length > 0) {
                      onFormChange("coverImage", urls[0]);
                    }
                  }}
                  onStatusChange={(msg) => console.log(msg)}
                  successMessage={(urls) => `Successfully uploaded ${urls.length} image`}
                />
                {form.coverImage && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-naki-steel bg-naki-frost p-3">
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-naki-smoke truncate">{form.coverImage}</p>
                      <button
                        type="button"
                        className="mt-1 text-xs text-naki-secondary hover:opacity-80"
                        onClick={() => onFormChange("coverImage", "")}
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-primary">Excerpt *</span>
                <textarea
                  className="resize-y rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm text-naki-primary leading-relaxed outline-none transition focus:border-naki-primary"
                  value={form.excerpt}
                  onChange={(event) => onFormChange("excerpt", event.target.value)}
                  placeholder="Brief summary of the article..."
                  required
                  rows={3}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-naki-primary">Content *</span>
                <textarea
                  className="resize-y rounded-lg border border-naki-steel bg-naki-page-bg px-3 py-2 text-sm text-naki-primary leading-relaxed outline-none transition focus:border-naki-primary"
                  value={form.content}
                  onChange={(event) => onFormChange("content", event.target.value)}
                  placeholder="Write article content. Markdown supported."
                  required
                  rows={12}
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-naki-steel pt-5">
                <button
                  className="inline-flex h-10 items-center rounded-lg border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                  onClick={onCloseModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  disabled={isSaving}
                  type="submit"
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : form.id ? "Save" : "Create"}
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
          <div className="w-full my-10 mx-4 max-w-4xl rounded-2xl bg-white shadow-naki-card">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-naki-steel bg-white p-5">
              <h2 className="text-xl font-bold text-naki-primary">
                Article Preview
              </h2>
              <button
                className="grid size-9 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost"
                onClick={() => setPreviewPost(null)}
                type="button"
                aria-label="Close preview"
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
                <span>by {previewPost.author}</span>
                <span>•</span>
                <span>
                  {new Date(previewPost.publishedAt || previewPost.createdAt).toLocaleDateString('en-US', {
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
