import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  isLoading = false,
  onPageChange,
}: PaginationControlsProps) {
  if (total <= pageSize && totalPages <= 1) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const canGoPrevious = page > 1;
  const canGoNext = page < safeTotalPages;

  return (
    <nav
      className="flex flex-col gap-3 rounded-lg border border-naki-steel bg-naki-frost p-3 shadow-naki-card sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="text-sm font-bold text-naki-smoke">
        Halaman{" "}
        <span className="font-black text-naki-primary">{page}</span> dari{" "}
        <span className="font-black text-naki-primary">{safeTotalPages}</span>{" "}
        ({total} data)
      </p>
      <div className="flex gap-2">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel px-3 text-sm font-black text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
          disabled={!canGoPrevious || isLoading}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft size={16} />
          Sebelumnya
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-3 text-sm font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
          disabled={!canGoNext || isLoading}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Berikutnya
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
