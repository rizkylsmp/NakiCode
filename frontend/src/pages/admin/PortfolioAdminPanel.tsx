import { Edit3, ExternalLink, Globe2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { type PortfolioItem } from "../../domain/content";
import { normalizeCoverIndex, type PortfolioFormState } from "./AdminTemplateWorkspace.shared";
import { PortfolioFormModal } from "./PortfolioFormModal";

type PortfolioAdminPanelProps = {
  projects: PortfolioItem[];
  form: PortfolioFormState;
  status: string;
  isSaving: boolean;
  isModalOpen: boolean;
  deletingProjectId: number | null;
  adminToken: string | null;
  onStartEdit: (project: PortfolioItem) => void;
  onReset: () => void;
  onDelete: (project: PortfolioItem) => void;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onUpdateField: <Key extends keyof PortfolioFormState>(key: Key, value: PortfolioFormState[Key]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function PortfolioAdminPanel({
  projects,
  form,
  status,
  isSaving,
  isModalOpen,
  deletingProjectId,
  adminToken,
  onStartEdit,
  onReset,
  onDelete,
  onOpenModal,
  onCloseModal,
  onUpdateField,
  onSubmit,
  onConfirmDelete,
  onCancelDelete,
}: PortfolioAdminPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Portfolio</h1>
          <p className="mt-1 text-sm text-naki-smoke">
            {projects.length} items displayed on the storefront portfolio section.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-naki-frost px-3 py-2 text-sm font-semibold text-naki-primary">
            <Globe2 size={16} />
            {projects.length} live
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-naki-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            onClick={() => {
              onReset();
              onOpenModal();
            }}
            type="button"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-naki-steel bg-white p-12 text-center shadow-sm">
          <span className="mx-auto grid size-14 place-items-center rounded-xl bg-naki-frost text-naki-smoke">
            <Globe2 size={28} />
          </span>
          <h3 className="mt-5 text-xl font-bold text-naki-primary">No portfolio yet.</h3>
          <p className="mt-2 text-sm text-naki-smoke">
            Add completed websites to display on the homepage.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <PortfolioProjectCard
              key={project.id ?? project.title}
              project={project}
              isSelected={form.id === project.id}
              isDeleting={deletingProjectId === project.id}
              onDelete={onDelete}
              onStartEdit={onStartEdit}
            />
          ))}
        </div>
      )}

      <PortfolioFormModal
        adminToken={adminToken}
        form={form}
        isOpen={isModalOpen}
        isSaving={isSaving}
        status={status}
        onClose={onCloseModal}
        onReset={onReset}
        onSubmit={onSubmit}
        onUpdateField={onUpdateField}
      />

      {deletingProjectId !== null ? createPortal(
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto bg-naki-primary/40 px-4 py-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full my-10 mx-4 max-w-md rounded-2xl bg-white shadow-sm">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-naki-steel bg-white/95 p-5 backdrop-blur">
              <h2 className="text-2xl font-bold leading-tight text-naki-primary">
                Hapus Portofolio?
              </h2>
              <button
                className="grid size-10 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:border-naki-smoke"
                onClick={onCancelDelete}
                type="button"
                aria-label="Tutup dialog"
              >
                <X size={17} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-naki-smoke leading-relaxed">
                Portofolio akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-naki-steel pt-5 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-5 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                  onClick={onCancelDelete}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-secondary px-5 text-sm font-medium text-white transition hover:opacity-90"
                  onClick={onConfirmDelete}
                  type="button"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function PortfolioProjectCard({
  project,
  isSelected,
  isDeleting,
  onDelete,
  onStartEdit,
}: {
  project: PortfolioItem;
  isSelected: boolean;
  isDeleting: boolean;
  onDelete: (project: PortfolioItem) => void;
  onStartEdit: (project: PortfolioItem) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const coverIndex = normalizeCoverIndex(project.coverIndex, project.imageUrls ?? []);
  const coverImage =
    project.imageUrls && project.imageUrls.length > 0
      ? project.imageUrls[coverIndex]
      : project.imageUrl;
  const hasWebsite = Boolean(project.websiteUrl && project.websiteUrl !== "#");

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-naki-soft ${
        isSelected ? "ring-2 ring-naki-secondary" : ""
      }`}
    >
      <div className="relative flex h-44 items-end overflow-hidden bg-naki-primary p-4 text-naki-frost">
        {coverImage && !imageError ? (
          <>
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={coverImage}
              alt={project.title}
              onError={() => setImageError(true)}
            />
            <span className="absolute inset-0 bg-naki-primary/62" />
          </>
        ) : (
          <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent),radial-gradient(circle_at_top_right,rgba(240,244,245,0.2),transparent_40%)]" />
        )}
        <div className="relative min-w-0">
          <p className="text-xs font-medium uppercase text-naki-frost/80">
            {project.category}
          </p>
          <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-white">
            {project.title}
          </h3>
        </div>
      </div>
      <div className="p-5">
        <div>
          <p className="line-clamp-2 text-sm leading-relaxed text-naki-smoke">
            {project.description}
          </p>
          <p className="mt-3 rounded-xl bg-naki-frost px-3 py-2.5 text-sm font-medium text-naki-primary">
            {project.result}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-naki-steel pt-3">
          <p className="min-w-0 truncate text-xs font-medium text-naki-smoke">
            {hasWebsite ? project.websiteUrl : "URL belum diisi"}
          </p>
          <div className="flex shrink-0 gap-2">
            {hasWebsite ? (
              <a
                className="grid size-9 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-secondary"
                href={project.websiteUrl}
                rel="noreferrer"
                target="_blank"
                aria-label={`Buka ${project.title}`}
              >
                <ExternalLink size={15} />
              </a>
            ) : null}
            <button
              className="grid size-9 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-secondary"
              onClick={() => onStartEdit(project)}
              type="button"
              aria-label={`Edit ${project.title}`}
            >
              <Edit3 size={15} />
            </button>
            <button
              className="grid size-9 place-items-center rounded-lg border border-naki-steel bg-white text-naki-smoke transition hover:border-naki-steel hover:text-naki-secondary disabled:cursor-not-allowed disabled:text-naki-smoke"
              disabled={isDeleting}
              onClick={() => onDelete(project)}
              type="button"
              aria-label={`Hapus ${project.title}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
