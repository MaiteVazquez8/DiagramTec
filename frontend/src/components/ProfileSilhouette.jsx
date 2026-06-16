/** Avatar circular burdeos + silueta (mismo SVG que el header). */
export default function ProfileSilhouette({ size = 48, className = '' }) {
  return (
    <svg
      className={`figma-profile-svg ${className}`.trim()}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden
    >
      <circle cx="24" cy="24" r="24" className="figma-profile-bg" />
      <circle cx="24" cy="17.5" r="6.25" className="figma-profile-silhouette" />
      <ellipse cx="24" cy="36" rx="11" ry="7.5" className="figma-profile-silhouette" />
    </svg>
  );
}
