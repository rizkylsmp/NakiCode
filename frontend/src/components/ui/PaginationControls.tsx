import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading?: boolean;
  alwaysVisible?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  getPageHref?: (page: number) => string;
};

export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  isLoading = false,
  alwaysVisible = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  getPageHref,
}: PaginationControlsProps) {
  if (!alwaysVisible && total <= pageSize && totalPages <= 1) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const canGoPrevious = page > 1;
  const canGoNext = page < safeTotalPages;
  const availablePageSizes = Array.from(
    new Set([pageSize, ...pageSizeOptions]),
  ).sort((left, right) => left - right);

  return (
    <nav
      className="flex flex-col gap-2 rounded-lg border border-naki-steel bg-naki-frost p-2 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-start">
        <p className="text-xs font-medium text-naki-smoke">
          Halaman <span className="font-bold text-naki-primary">{page}</span>{" "}
          dari{" "}
          <span className="font-bold text-naki-primary">{safeTotalPages}</span>{" "}
          <span className="text-naki-smoke/80">({total} data)</span>
        </p>
        {onPageSizeChange ? (
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-naki-smoke">
            <span>Maks.</span>
            <select
              aria-label="Maksimal data per halaman"
              className="h-8 min-w-18 rounded-md border border-naki-steel bg-white py-0 pl-2 pr-7 text-xs font-semibold text-naki-primary outline-none focus:border-naki-primary"
              disabled={isLoading}
              onChange={(event) =>
                onPageSizeChange(Number(event.target.value))
              }
              value={pageSize}
            >
              {availablePageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
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
  const className = `inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold transition sm:px-2.5 ${
    variant === "primary"
      ? "bg-naki-secondary text-naki-frost hover:bg-naki-primary"
      : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"
  } ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`;
  const content = (
    <>
      {icon === "previous" ? <ChevronLeft size={14} /> : null}
      {label}
      {icon === "next" ? <ChevronRight size={14} /> : null}
    </>
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  if (!href) {
    return (
      <button className={className} onClick={onClick} type="button">
        {content}
      </button>
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
