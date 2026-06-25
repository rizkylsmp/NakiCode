/**
 * Base Skeleton component for loading states
 * Provides smooth pulse animation matching Naki Code design system
 */

interface SkeletonProps {
  /**
   * Width of skeleton (e.g., "100%", "200px", "50%")
   * @default "100%"
   */
  width?: string;
  
  /**
   * Height of skeleton (e.g., "20px", "100px", "200px")
   * @default "1rem"
   */
  height?: string;
  
  /**
   * Border radius (e.g., "4px", "8px", "50%")
   * @default "0.5rem"
   */
  radius?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  radius = "0.5rem",
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-naki-steel ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for text lines with natural width variation
 */
interface SkeletonTextProps {
  /**
   * Number of lines to render
   * @default 1
   */
  lines?: number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SkeletonText({ lines = 1, className = "" }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => {
        // Vary width for natural text appearance
        const widths = ["100%", "95%", "90%", "85%", "92%"];
        const width = index === lines - 1 && lines > 1
          ? widths[Math.min(index, widths.length - 1)]
          : "100%";
        
        return (
          <Skeleton
            key={index}
            width={width}
            height="0.875rem"
            radius="0.25rem"
          />
        );
      })}
    </div>
  );
}
