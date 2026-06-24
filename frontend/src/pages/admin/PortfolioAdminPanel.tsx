import { Edit3, ExternalLink, Globe2, Plus, Trash2 } from "lucide-react";
import { type PortfolioItem } from "../../content";
import { normalizeCoverIndex, type PortfolioFormState } from "./AdminTemplateWorkspace.shared";

type PortfolioAdminPanelProps = {
  projects: PortfolioItem[];
  form: PortfolioFormState;
  status: string;
  deletingProjectId: number | null;
  onStartEdit: (project: PortfolioItem) => void;
  onReset: () => void;
  onDelete: (project: PortfolioItem) => void;
};

export function PortfolioAdminPanel({
  projects,
  form,
  status,
  deletingProjectId,
  onStartEdit,
  onReset,
  onDelete,
}: PortfolioAdminPanelProps) {
  return (
    <section className="py-8">
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-naki-card sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black">Website yang sudah jadi</h2>
          <p className="mt-1 text-sm font-semibold text-naki-smoke">
            {projects.length} item tampil di section Portofolio storefront.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-naki-steel px-3 text-sm font-black text-naki-secondary">
            <Globe2 size={16} />
            {projects.length} live
          </span>
          <span className="inline-flex min-h-10 items-center rounded-lg border border-naki-steel px-3 py-2 text-sm font-black text-naki-secondary">
            {status}
          </span>
          <button
            className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
            onClick={onReset}
            type="button"
          >
            <Plus size={16} />
            Tambah baru
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-naki-steel bg-naki-frost p-10 text-center shadow-naki-card">
          <span className="mx-auto grid size-14 place-items-center rounded-xl bg-naki-steel text-naki-secondary">
            <Globe2 size={28} />
          </span>
          <h3 className="mt-5 text-2xl font-black">Belum ada portofolio.</h3>
          <p className="mt-2 text-naki-smoke">
            Tambahkan website yang sudah selesai agar tampil di halaman utama.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => {
            const coverIndex = normalizeCoverIndex(
              project.coverIndex,
              project.imageUrls ?? [],
            );
            const coverImage =
              project.imageUrls && project.imageUrls.length > 0
                ? project.imageUrls[coverIndex]
                : project.imageUrl;

            return (
              <article
                key={project.id ?? project.title}
                className={`overflow-hidden rounded-xl border bg-naki-frost shadow-naki-card transition hover:-translate-y-0.5 hover:shadow-naki-soft ${
                  form.id === project.id
                    ? "border-naki-secondary"
                    : "border-naki-steel"
                }`}
              >
                <div className="relative flex h-44 items-end overflow-hidden bg-naki-primary p-4 text-naki-frost">
                  {coverImage ? (
                    <>
                      <img
                        className="absolute inset-0 h-full w-full object-cover"
                        src={coverImage}
                        alt={project.title}
                      />
                      <span className="absolute inset-0 bg-naki-primary/62" />
                    </>
                  ) : (
                    <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent),radial-gradient(circle_at_top_right,rgba(240,244,245,0.2),transparent_40%)]" />
                  )}
                  <div className="relative min-w-0">
                    <p className="text-xs font-black uppercase text-naki-steel">
                      {project.category}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight">
                      {project.title}
                    </h3>
                  </div>
                </div>
                <div className="grid gap-4 p-4">
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold leading-6 text-naki-smoke">
                      {project.description}
                    </p>
                    <p className="mt-3 rounded-lg bg-naki-steel px-3 py-2 text-sm font-black text-naki-primary">
                      {project.result}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-naki-steel pt-3">
                    <p className="min-w-0 truncate text-xs font-bold text-naki-smoke">
                      {project.websiteUrl && project.websiteUrl !== "#"
                        ? project.websiteUrl
                        : "URL belum diisi"}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      {project.websiteUrl && project.websiteUrl !== "#" ? (
                        <a
                          className="grid size-9 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke"
                          href={project.websiteUrl}
                          rel="noreferrer"
                          target="_blank"
                          aria-label={`Buka ${project.title}`}
                        >
                          <ExternalLink size={15} />
                        </a>
                      ) : null}
                      <button
                        className="grid size-9 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke"
                        onClick={() => onStartEdit(project)}
                        type="button"
                        aria-label={`Edit ${project.title}`}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="grid size-9 place-items-center rounded-lg border border-naki-steel text-naki-smoke transition hover:border-naki-smoke hover:text-naki-primary disabled:cursor-not-allowed disabled:text-naki-smoke"
                        disabled={deletingProjectId === project.id}
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
          })}
        </div>
      )}
    </section>
  );
}

