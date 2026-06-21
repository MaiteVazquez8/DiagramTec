/** Avatar circular burdeos + silueta (mismo SVG que el header). */

/**
 * Silueta de perfil genérica en SVG (círculo + cabeza + hombros).
 * @param {number} [size=48] - Ancho y alto en píxeles
 * @param {string} [className=''] - Clases CSS adicionales para el SVG
 */
export default function ProfileSilhouette({ size = 48, className = '' }) {
  return (
    <svg
      className={`figma-profile-svg ${className}`.trim()}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden
    >
      {/* Fondo circular burdeos */}
      <circle cx="24" cy="24" r="24" className="figma-profile-bg" />
      {/* Cabeza (círculo pequeño) */}
      <circle cx="24" cy="17.5" r="6.25" className="figma-profile-silhouette" />
      {/* Torso (elipse) */}
      <ellipse cx="24" cy="36" rx="11" ry="7.5" className="figma-profile-silhouette" />
    </svg>
  );
}
