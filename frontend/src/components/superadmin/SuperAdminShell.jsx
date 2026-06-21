/** Layout común del panel superadmin: sidebar + contenido. */
import { useState } from 'react';
import SuperAdminSidebar from '../SuperAdminSidebar.jsx';

/**
 * Envoltorio de layout para todas las páginas del panel superadmin.
 * @param {React.ReactNode} children - Contenido principal (dashboard, gestión, etc.)
 */
export default function SuperAdminShell({ children }) {
  // Controla si la barra lateral está contraída o expandida
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="superadmin-dashboard figma-dot-pattern" id="superadmin-shell">
      <div className="superadmin-dashboard__frame">
        {/* Sidebar con perfil del usuario y logout */}
        <SuperAdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
        {/* Área de contenido dinámico según la ruta hija */}
        <div className="superadmin-dashboard__content">
          {children}
        </div>
      </div>
    </div>
  );
}
