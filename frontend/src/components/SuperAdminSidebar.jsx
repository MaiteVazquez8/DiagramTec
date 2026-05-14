import Icon from './Icon.jsx';
import { useAuth } from '../AuthContext';

export default function SuperAdminSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="superadmin-sidebar">
      <div className="admin-avatar-circle">
        S
      </div>
      <div className="sidebar-text-info">
        <div className="admin-name-tag">
          Super Admin
        </div>
        <div className="admin-role-tag">
          Super Administrador
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <button className="admin-sidebar-btn">
          <Icon name="edit" />
          Editor INFO
        </button>
        
        <button className="admin-sidebar-btn" onClick={logout}>
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
