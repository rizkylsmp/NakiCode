import { Skeleton } from "./Skeleton";

/**
 * Skeleton loader for blog post cards
 * Matches the structure of blog cards in BlogListPage
 */
export function BlogCardSkeleton() {
  return (
    <div className="group rounded-xl border border-naki-steel bg-naki-frost p-5 shadow-naki-card">
      {/* Icon skeleton */}
      <Skeleton width="1.5rem" height="1.5rem" radius="0.25rem" className="mb-5" />
      
      {/* Author skeleton */}
      <Skeleton width="6rem" height="0.75rem" radius="0.25rem" className="mb-2" />
      
      {/* Title skeleton */}
      <Skeleton height="1.5rem" radius="0.25rem" className="mb-3" />
      
      {/* Excerpt skeleton - 3 lines */}
      <div className="mb-4 space-y-2">
        <Skeleton height="0.875rem" radius="0.25rem" />
        <Skeleton height="0.875rem" radius="0.25rem" />
        <Skeleton width="75%" height="0.875rem" radius="0.25rem" />
      </div>
      
      {/* "Baca artikel" button skeleton */}
      <Skeleton width="7rem" height="1rem" radius="0.25rem" />
    </div>
  );
}

/**
 * Grid of blog card skeletons
 * Used while blog posts are loading
 */
interface BlogCardSkeletonGridProps {
  /**
   * Number of skeleton cards to show
   * @default 6
   */
  count?: number;
}

export function BlogCardSkeletonGrid({ count = 6 }: BlogCardSkeletonGridProps) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <BlogCardSkeleton key={index} />
      ))}
    </div>
  );
}
