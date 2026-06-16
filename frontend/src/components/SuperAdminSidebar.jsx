/** Sidebar del panel superadmin (Figma): perfil, colapsar y cerrar sesión. */
import Icon from './Icon.jsx';
import ProfileSilhouette from './ProfileSilhouette.jsx';
import { useAuth } from '../AuthContext.jsx';

function roleLabel(role) {
  if (role === 'superadmin') return 'Superadmin';
  if (role === 'teacher') return 'Profesor';
  if (role === 'student') return 'Alumno';
  return role || '';
}

export default function SuperAdminSidebar({ collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const fullName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : '';

  return (
    <aside
      className={`superadmin-sidebar${collapsed ? ' superadmin-sidebar--collapsed' : ''}`}
      aria-label="Panel lateral"
    >
      <button
        type="button"
        className="superadmin-sidebar__collapse"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        aria-expanded={!collapsed}
      >
        <Icon name="chevronRight" size={14} strokeWidth={2.5} />
      </button>

      <div className="superadmin-sidebar__body">
        <div className="superadmin-sidebar__profile">
          <div className="superadmin-sidebar__avatar-ring">
            <ProfileSilhouette size={80} className="superadmin-sidebar__avatar-svg" />
          </div>
          {fullName && <p className="superadmin-sidebar__name">{fullName}</p>}
          {user?.email && <p className="superadmin-sidebar__email">{user.email}</p>}
          {user?.role && <p className="superadmin-sidebar__role">{roleLabel(user.role)}</p>}
        </div>
      </div>

      <div className="superadmin-sidebar__footer">
        <button type="button" className="superadmin-sidebar__logout" onClick={logout}>
          <span className="superadmin-sidebar__logout-icon" aria-hidden>
            <Icon name="logout" size={20} strokeWidth={2} />
          </span>
          <span className="superadmin-sidebar__logout-text">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
