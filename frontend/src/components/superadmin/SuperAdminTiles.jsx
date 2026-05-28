/** Tarjetas del dashboard superadmin (datos reales de la API). */
import Icon from '../Icon.jsx';
import ProfileSilhouette from '../ProfileSilhouette.jsx';

const PREVIEW_LIMIT = 6;

export function previewItems(items) {
  return items.slice(0, PREVIEW_LIMIT);
}

function personLabel(user) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email || 'Usuario';
}

export function SuperAdminPersonTile({ user, onClick }) {
  return (
    <button type="button" className="superadmin-tile" onClick={onClick}>
      <div className="superadmin-tile__media figma-dot-pattern">
        <ProfileSilhouette size={52} />
      </div>
      <span className="superadmin-tile__label" title={personLabel(user)}>
        {personLabel(user)}
      </span>
    </button>
  );
}

export function SuperAdminClassTile({ classItem, onClick }) {
  return (
    <button type="button" className="superadmin-tile superadmin-tile--class" onClick={onClick}>
      <div className="superadmin-tile__media figma-dot-pattern">
        <Icon name="classBook" size={40} className="superadmin-tile__book" strokeWidth={1.2} />
      </div>
      <span className="superadmin-tile__label" title={classItem.title}>
        {classItem.title}
      </span>
    </button>
  );
}

export function SuperAdminSection({
  id,
  title,
  verTodoHref,
  onVerTodo,
  emptyMessage,
  isEmpty,
  children,
}) {
  return (
    <section className="superadmin-row" id={id}>
      <div className="superadmin-row__head">
        <h2 className="superadmin-row__title">{title}</h2>
        {!isEmpty && (
          <a href={verTodoHref} className="superadmin-row__link" onClick={onVerTodo}>
            Ver todo &gt;
          </a>
        )}
      </div>
      {isEmpty ? (
        <p className="superadmin-row__empty">{emptyMessage}</p>
      ) : (
        <div className="superadmin-cards-grid">{children}</div>
      )}
    </section>
  );
}
