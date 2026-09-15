import { useEffect, useMemo, useState } from "react";

export const adminListPageSize = 10;

export function useClientPagination<Item>(
  items: Item[],
  initialPageSize = adminListPageSize,
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  function setPageSize(nextPageSize: number) {
    setPageSizeState(nextPageSize);
    setPage(1);
  }

  return {
    page,
    pageSize,
    paginatedItems,
    setPage,
    setPageSize,
    totalPages,
  };
}
