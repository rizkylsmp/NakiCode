import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  getPageHref?: (page: number) => string;
};

export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  isLoading = false,
  onPageChange,
  getPageHref,
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
        Halaman <span className="font-black text-naki-primary">{page}</span>{" "}
        dari{" "}
        <span className="font-black text-naki-primary">{safeTotalPages}</span> (
        {total} data)
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <PaginationLink
          disabled={!canGoPrevious || isLoading}
          href={getPageHref?.(page - 1)}
          label="Sebelumnya"
          onClick={() => onPageChange(page - 1)}
          variant="secondary"
          icon="previous"
        />
        <PaginationLink
          disabled={!canGoNext || isLoading}
          href={getPageHref?.(page + 1)}
          label="Berikutnya"
          onClick={() => onPageChange(page + 1)}
          variant="primary"
          icon="next"
        />
      </div>
    </nav>
  );
}

type PaginationLinkProps = {
  disabled: boolean;
  href?: string;
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary";
  icon: "previous" | "next";
};

function PaginationLink({
  disabled,
  href,
  label,
  onClick,
  variant,
  icon,
}: PaginationLinkProps) {
  const className = `inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition sm:gap-2 sm:px-3 sm:text-sm ${
    variant === "primary"
      ? "bg-naki-secondary text-naki-frost hover:bg-naki-primary"
      : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"
  } ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`;
  const content = (
    <>
      {icon === "previous" ? <ChevronLeft size={16} /> : null}
      {label}
      {icon === "next" ? <ChevronRight size={16} /> : null}
    </>
  );

  if (!href || disabled) {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <a
      className={className}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {content}
    </a>
  );
}
