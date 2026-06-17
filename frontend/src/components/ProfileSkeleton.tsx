import { Skeleton } from "./Skeleton";

/**
 * Skeleton loader for user profile section
 * Used in UserProfilePage while loading profile data
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-start gap-4">
        {/* Avatar skeleton */}
        <Skeleton width="4rem" height="4rem" radius="50%" />
        
        <div className="flex-1 space-y-2">
          {/* Username skeleton */}
          <Skeleton width="12rem" height="1.5rem" radius="0.25rem" />
          
          {/* Email skeleton */}
          <Skeleton width="16rem" height="1rem" radius="0.25rem" />
          
          {/* Role badge skeleton */}
          <Skeleton width="6rem" height="1.25rem" radius="0.25rem" />
        </div>
      </div>
      
      {/* Profile sections skeleton */}
      <div className="space-y-4">
        {/* Section 1 */}
        <div className="rounded-lg border border-naki-steel bg-naki-frost p-5">
          <Skeleton width="8rem" height="1.25rem" radius="0.25rem" className="mb-4" />
          <div className="space-y-3">
            <Skeleton height="2.5rem" radius="0.5rem" />
            <Skeleton height="2.5rem" radius="0.5rem" />
          </div>
        </div>
        
        {/* Section 2 */}
        <div className="rounded-lg border border-naki-steel bg-naki-frost p-5">
          <Skeleton width="10rem" height="1.25rem" radius="0.25rem" className="mb-4" />
          <div className="space-y-3">
            <Skeleton height="2.5rem" radius="0.5rem" />
            <Skeleton height="2.5rem" radius="0.5rem" />
            <Skeleton height="2.5rem" radius="0.5rem" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for order list items
 * Used in MyOrdersPage while loading orders
 */
export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border border-naki-steel bg-naki-frost p-5 shadow-naki-card">
      {/* Order header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton width="10rem" height="1.25rem" radius="0.25rem" />
          <Skeleton width="8rem" height="0.875rem" radius="0.25rem" />
        </div>
        <Skeleton width="6rem" height="1.5rem" radius="0.5rem" />
      </div>
      
      {/* Order details */}
      <div className="space-y-2 border-t border-naki-steel pt-4">
        <Skeleton width="14rem" height="1rem" radius="0.25rem" />
        <Skeleton width="10rem" height="1rem" radius="0.25rem" />
      </div>
      
      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Skeleton width="6rem" height="2.5rem" radius="0.5rem" />
        <Skeleton width="5rem" height="2.5rem" radius="0.5rem" />
      </div>
    </div>
  );
}

/**
 * Grid of order card skeletons
 */
interface OrderCardSkeletonGridProps {
  count?: number;
}

export function OrderCardSkeletonGrid({ count = 3 }: OrderCardSkeletonGridProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </div>
  );
}
