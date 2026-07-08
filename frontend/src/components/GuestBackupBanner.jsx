import { Link } from 'react-router-dom';

/** Aviso de backup de invitado pendiente (p. ej. en Mis diseños). */
export default function GuestBackupBanner({ backup, onDismiss }) {
  if (!backup) return null;

  const savedAt = backup.savedAt
    ? new Date(backup.savedAt).toLocaleString()
    : '';

  return (
    <div className="guest-backup-banner" role="status" aria-live="polite">
      <p className="guest-backup-banner__text">
        Tenés un diagrama sin guardar del modo invitado
        {savedAt ? ` (${savedAt})` : ''}
        . ¿Querés recuperarlo?
      </p>
      <div className="guest-backup-banner__actions">
        <Link to="/editor" className="guest-backup-banner__btn guest-backup-banner__btn--primary">
          Recuperar
        </Link>
        <button type="button" className="guest-backup-banner__btn" onClick={onDismiss}>
          Descartar
        </button>
      </div>
    </div>
  );
}
