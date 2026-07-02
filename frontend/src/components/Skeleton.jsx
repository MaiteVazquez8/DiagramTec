/** Bloque base con animación shimmer para estados de carga. */
export default function Skeleton({ className = '', style, ...props }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ width = '100%', height = '0.85rem', className = '' }) {
  return (
    <Skeleton
      className={`skeleton-text ${className}`.trim()}
      style={{ width, height }}
    />
  );
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <Skeleton
      className={`skeleton-circle ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}
