/** Fila de clase en gestión superadmin (mock Figma). */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon.jsx';

export default function SuperAdminClassManageRow({ classItem, onDelete, onCopyCode }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!classItem.code) return;
    try {
      await navigator.clipboard.writeText(classItem.code);
      setCopied(true);
      onCopyCode?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="superadmin-class-row superadmin-class-row--card" role="row">
      <div className="superadmin-class-row__cell superadmin-class-row__cell--title" role="cell">
        <button
          type="button"
          className="superadmin-class-row__title-btn"
          onClick={() => navigate(`/classes/${classItem.id}`)}
          title={classItem.title}
        >
          <Icon name="classBook" size={22} className="superadmin-class-row__book" strokeWidth={1.2} />
          <span>{classItem.title}</span>
        </button>
      </div>

      <div className="superadmin-class-row__cell" role="cell">
        <div className="superadmin-class-row__pill" title={classItem.ownerName}>
          {classItem.ownerName || '—'}
        </div>
      </div>

      <div className="superadmin-class-row__cell" role="cell">
        <div className="superadmin-class-row__pill superadmin-class-row__pill--code">
          <span className="superadmin-class-row__code-text">{classItem.code || '—'}</span>
          {classItem.code && (
            <button
              type="button"
              className="superadmin-class-row__copy"
              onClick={handleCopy}
              aria-label={copied ? 'Código copiado' : 'Copiar código'}
              title={copied ? 'Copiado' : 'Copiar código'}
            >
              <Icon name="copy" size={16} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      <div className="superadmin-class-row__cell superadmin-class-row__cell--count" role="cell">
        <div className="superadmin-class-row__pill superadmin-class-row__pill--count">
          {classItem.studentCount ?? 0}
        </div>
      </div>

      <div className="superadmin-class-row__cell superadmin-class-row__cell--delete" role="cell">
        <button
          type="button"
          className="superadmin-manage__btn-delete"
          onClick={() => onDelete(classItem.id)}
          aria-label={`Eliminar clase ${classItem.title}`}
        >
          <Icon name="close" size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
