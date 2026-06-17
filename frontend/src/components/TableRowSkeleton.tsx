import { Skeleton } from "./Skeleton";

/**
 * Skeleton loader for table rows in admin pages
 * Used for orders, templates, and other admin data tables
 */
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-naki-steel bg-naki-frost">
      <td className="p-3">
        <Skeleton width="3rem" height="1rem" radius="0.25rem" />
      </td>
      <td className="p-3">
        <Skeleton height="1rem" radius="0.25rem" />
      </td>
      <td className="p-3">
        <Skeleton width="8rem" height="1rem" radius="0.25rem" />
      </td>
      <td className="p-3">
        <Skeleton width="6rem" height="1rem" radius="0.25rem" />
      </td>
      <td className="p-3">
        <Skeleton width="5rem" height="2rem" radius="0.5rem" />
      </td>
    </tr>
  );
}

/**
 * Multiple table row skeletons
 * Shows while table data is loading
 */
interface TableRowSkeletonListProps {
  /**
   * Number of skeleton rows to show
   * @default 5
   */
  count?: number;
}

export function TableRowSkeletonList({ count = 5 }: TableRowSkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <TableRowSkeleton key={index} />
      ))}
    </>
  );
}
