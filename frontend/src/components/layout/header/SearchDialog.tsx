import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { TemplateItem } from "../../../domain/content";
import { apiGet } from "../../../services/api-client";

type TemplatesResponse = {
  templates: TemplateItem[];
};

type SearchDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const templatesQuery = useQuery({
    queryKey: ["header-design-search"],
    queryFn: () => apiGet<TemplatesResponse>("/api/designs"),
    enabled: isOpen,
    staleTime: 5 * 60_000,
  });
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return (templatesQuery.data?.templates ?? [])
      .filter((template) =>
        [
          template.title,
          template.category,
          template.description,
          template.stack.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, 6);
  }, [query, templatesQuery.data]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) return;
    navigate(`/design?q=${encodeURIComponent(normalized)}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-naki-primary/50 px-4 pt-20 backdrop-blur-sm sm:pt-28"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-naki-steel bg-white shadow-naki-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="design-search-title"
      >
        <div className="flex items-center justify-between border-b border-naki-steel px-4 py-3 sm:px-5">
          <div>
            <h2 id="design-search-title" className="font-bold text-naki-primary">
              Cari design
            </h2>
            <p className="text-xs text-naki-smoke">Nama, kategori, atau teknologi</p>
          </div>
          <button
            className="grid size-11 place-items-center rounded-xl text-naki-smoke transition hover:bg-naki-frost"
            onClick={onClose}
            type="button"
            aria-label="Tutup pencarian"
          >
            <X size={19} />
          </button>
        </div>

        <form className="p-4 sm:p-5" onSubmit={submitSearch}>
          <label className="relative block">
            <span className="sr-only">Cari design</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-naki-smoke"
              size={19}
            />
            <input
              autoFocus
              className="h-12 w-full rounded-xl border border-naki-steel bg-naki-frost pl-11 pr-4 text-sm text-naki-primary outline-none placeholder:text-naki-smoke"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: company profile atau React"
              type="search"
              value={query}
            />
          </label>
        </form>

        <div className="max-h-[55vh] overflow-y-auto border-t border-naki-steel p-2">
          {query.trim() && templatesQuery.isLoading ? (
            <p className="px-3 py-8 text-center text-sm text-naki-smoke" aria-live="polite">
              Mencari design...
            </p>
          ) : results.length > 0 ? (
            <div className="grid gap-1">
              {results.map((template) => (
                <Link
                  key={template.id}
                  className="flex min-h-14 items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition hover:bg-naki-frost"
                  onClick={onClose}
                  to={`/design/${template.slug}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-naki-primary">
                      {template.title}
                    </span>
                    <span className="block truncate text-xs text-naki-smoke">
                      {template.category} · {template.stack.slice(0, 3).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-blue-500">
                    Lihat
                  </span>
                </Link>
              ))}
              <button
                className="mt-1 min-h-11 rounded-xl px-3 text-left text-sm font-semibold text-blue-500 transition hover:bg-blue-50"
                type="button"
                onClick={() => {
                  navigate(`/design?q=${encodeURIComponent(query.trim())}`);
                  onClose();
                }}
              >
                Lihat semua hasil untuk &quot;{query.trim()}&quot;
              </button>
            </div>
          ) : query.trim() ? (
            <p className="px-3 py-8 text-center text-sm text-naki-smoke" aria-live="polite">
              Tidak ada design yang cocok. Tekan Enter untuk membuka katalog.
            </p>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-naki-smoke">
              Mulai ketik untuk menemukan design yang sesuai.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
