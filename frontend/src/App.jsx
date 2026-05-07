import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import ClassesPage from './pages/ClassesPage.jsx';
import ClassDetailPage from './pages/ClassDetailPage.jsx';
import DesignsPage from './pages/DesignsPage.jsx';
import EditorPage from './pages/EditorPage.jsx';
import SuperAdminPage from './pages/SuperAdminPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

import Icon from './components/Icon.jsx';

// ruta protegida solo para usuarios superadministradores
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-container">Cargando...</div>;
  if (!user || user.role !== 'superadmin') return <Navigate to="/" replace />;
  return children;
}

// ruta protegida para cualquier usuario autenticado
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-container">Cargando...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

// componente de cabecera con navegacion y estado del usuario
function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="app-header">
      {/* logo y nombre que redirigen al inicio */}
      <div className="header-left">
        <Link to="/" className="brand" onClick={closeMenu}>
          <img src="/logo.png" alt="Logo" style={{ height: '32px', marginRight: '10px' }} />
          DiagramTec
        </Link>
      </div>

      <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Menú móvil">
        <Icon name={menuOpen ? 'close' : 'menu'} size={24} strokeWidth={2.5} />
      </button>

      <div className={`nav-container ${menuOpen ? 'open' : ''}`}>
        <nav>
          <NavLink to="/" onClick={closeMenu}>Inicio</NavLink>
          <NavLink to="/designs" onClick={closeMenu}>Diseños</NavLink>
          {user ? <NavLink to="/classes" onClick={closeMenu}>Clases</NavLink> : null}
          {user?.role === 'superadmin' ? <NavLink to="/superadmin" onClick={closeMenu}>Panel Admin</NavLink> : null}
          {user ? <NavLink to="/account" onClick={closeMenu}>Mi cuenta</NavLink> : null}
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-nav-group">
              <Link to="/account" className="user-chip" title="Ver mi cuenta" onClick={closeMenu}>
                <span className="user-avatar">{user.firstName[0]}</span>
                <div className="user-info-text">
                  <span className="user-name">{user.firstName} {user.lastName}</span>
                  <span className="user-role-badge">
                    {user.role === 'superadmin' ? 'Administrador' : user.role === 'teacher' ? 'Profesor' : 'Alumno'}
                  </span>
                </div>
              </Link>
              <button className="logout-btn-premium" onClick={() => { logout(); closeMenu(); }} title="Cerrar sesión">
                <Icon name="logout" size={18} strokeWidth={2.5} />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <NavLink className="primary-button login-btn-header" to="/login" onClick={closeMenu}>
              Ingresar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

// componente principal de la aplicacion que define las rutas
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main>
          {/* definicion de todas las rutas de navegacion */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
            <Route path="/classes/:id" element={<ProtectedRoute><ClassDetailPage /></ProtectedRoute>} />
            <Route path="/designs" element={<DesignsPage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/editor/:id" element={<EditorPage />} />
            <Route path="/superadmin" element={<AdminRoute><SuperAdminPage /></AdminRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
