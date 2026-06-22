/** Indicador de carga circular (botones y pantallas). */
export default function Spinner({ size = 20, className = '' }) {
  return (
    <span
      className={`ui-spinner ${className}`.trim()}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  );
}
