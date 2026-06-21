/** Notificación global (esquina superior derecha, estilo Figma burdeos). */
import Icon from './Icon';

/**
 * Toast flotante para mensajes de éxito o error.
 * @param {string} [message] - Texto informativo (role="status")
 * @param {string} [error] - Texto de error (role="alert")
 * @param {Function} onCloseMessage - Cierra el toast de mensaje
 * @param {Function} onCloseError - Cierra el toast de error
 * @param {string} [containerClassName=''] - Clases extra del contenedor
 */
export default function AppToast({
  message,
  error,
  onCloseMessage,
  onCloseError,
  containerClassName = '',
}) {
  // No renderiza nada si no hay contenido que mostrar
  if (!message && !error) return null;

  return (
    <div className={`toast-container ${containerClassName}`.trim()} aria-live="polite">
      {/* Toast de éxito/información */}
      {message ? (
        <div className="app-toast" role="status">
          <p className="app-toast__text">{message}</p>
          <button
            type="button"
            className="app-toast__close"
            onClick={onCloseMessage}
            aria-label="Cerrar notificación"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ) : null}
      {/* Toast de error (prioridad visual distinta vía role="alert") */}
      {error ? (
        <div className="app-toast" role="alert">
          <p className="app-toast__text">{error}</p>
          <button
            type="button"
            className="app-toast__close"
            onClick={onCloseError}
            aria-label="Cerrar notificación"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
