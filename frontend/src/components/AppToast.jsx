/** Notificación global (esquina superior derecha, estilo Figma burdeos). */
import Icon from './Icon';

export default function AppToast({
  message,
  error,
  onCloseMessage,
  onCloseError,
  containerClassName = '',
}) {
  if (!message && !error) return null;

  return (
    <div className={`toast-container ${containerClassName}`.trim()} aria-live="polite">
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
