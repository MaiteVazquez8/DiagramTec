/** Tarjetas del dashboard superadmin (datos reales de la API). */
import Icon from '../Icon.jsx';
import ProfileSilhouette from '../ProfileSilhouette.jsx';

/** Cantidad máxima de ítems mostrados en la vista previa del dashboard. */
const PREVIEW_LIMIT = 6;

/** Devuelve solo los primeros N ítems para la grilla de preview. */
export function previewItems(items) {
  return items.slice(0, PREVIEW_LIMIT);
}

/** Etiqueta visible: nombre completo o email como fallback. */
function personLabel(user) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email || 'Usuario';
}

/**
 * Tarjeta clickeable de un usuario (alumno o profesor).
 * @param {object} user - Datos del usuario desde la API
 * @param {Function} onClick - Navega o abre detalle al hacer clic
 */
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

/**
 * Tarjeta clickeable de una clase.
 * @param {object} classItem - Datos de la clase (title, id, etc.)
 * @param {Function} onClick - Handler de navegación al detalle
 */
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

/**
 * Sección del dashboard con título, enlace "Ver todo" y grilla de tarjetas.
 * @param {string} id - id del section (anclas / scroll)
 * @param {string} title - Título de la sección
 * @param {string} verTodoHref - href del enlace "Ver todo"
 * @param {Function} [onVerTodo] - Handler opcional al clicar "Ver todo"
 * @param {string} emptyMessage - Mensaje si no hay ítems
 * @param {boolean} isEmpty - Oculta grilla y muestra emptyMessage
 */
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
