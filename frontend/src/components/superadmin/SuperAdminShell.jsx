/** Layout común del panel superadmin: sidebar + contenido. */
import { useState } from 'react';
import SuperAdminSidebar from '../SuperAdminSidebar.jsx';

export default function SuperAdminShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="superadmin-dashboard figma-dot-pattern" id="superadmin-shell">
      <div className="superadmin-dashboard__frame">
        <SuperAdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
        <div className="superadmin-dashboard__content">
          {children}
        </div>
      </div>
    </div>
  );
}
