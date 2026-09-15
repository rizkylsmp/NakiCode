import { Skeleton } from "./Skeleton";

/**
 * Skeleton loader for template cards
 * Matches the structure of template cards in DesignCatalog
 */
export function DesignCardSkeleton() {
  return (
    <div className="rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-naki-card">
      {/* Preview image skeleton */}
      <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg">
        <Skeleton height="100%" radius="0" />
      </div>
      
      {/* Category badge skeleton */}
      <Skeleton width="5rem" height="1.25rem" radius="0.25rem" className="mb-3" />
      
      {/* Title skeleton */}
      <Skeleton height="1.5rem" radius="0.25rem" className="mb-2" />
      
      {/* Description skeleton - 2 lines */}
      <div className="mb-4 space-y-2">
        <Skeleton height="0.875rem" radius="0.25rem" />
        <Skeleton width="80%" height="0.875rem" radius="0.25rem" />
      </div>
      
      {/* Footer with price and button */}
      <div className="flex items-center justify-between">
        {/* Price skeleton */}
        <Skeleton width="6rem" height="1.25rem" radius="0.25rem" />
        
        {/* Button skeleton */}
        <Skeleton width="5rem" height="2.5rem" radius="0.5rem" />
      </div>
    </div>
  );
}

/**
 * Grid of template card skeletons
 * Used while template data is loading
 */
interface DesignCardSkeletonGridProps {
  /**
   * Number of skeleton cards to show
   * @default 6
   */
  count?: number;
}

export function DesignCardSkeletonGrid({ count = 6 }: DesignCardSkeletonGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <DesignCardSkeleton key={index} />
      ))}
    </div>
  );
}
