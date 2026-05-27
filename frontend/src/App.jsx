/**
 * Shell de la aplicación: proveedor de auth, router y layout común.
 * - Header con navegación Figma (Diseños | Inicio | Clases | Superadmin)
 * - Rutas públicas, protegidas (login) y admin (superadmin)
 * - El editor usa main.main-editor; el resto main.main-figma
 */
import React, { useState } from 'react';

import { BrowserRouter, Routes, Route, NavLink, Navigate, Link, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './AuthContext.jsx';

import HomePage from './pages/HomePage.jsx';

import LoginPage from './pages/LoginPage.jsx';

import SignupPage from './pages/SignupPage.jsx';

import AccountPage from './pages/AccountPage.jsx';

import EditProfilePage from './pages/EditProfilePage.jsx';

import ClassesPage from './pages/ClassesPage.jsx';

import ClassDetailPage from './pages/ClassDetailPage.jsx';

import DesignsPage from './pages/DesignsPage.jsx';

import EditorPage from './pages/EditorPage.jsx';

import SuperAdminPage from './pages/SuperAdminPage.jsx';

import NotFoundPage from './pages/NotFoundPage.jsx';



import RecoverPasswordPage from './pages/RecoverPasswordPage.jsx';
import Footer from './components/Footer.jsx';


import Icon from './components/Icon.jsx';



/** Solo usuarios con role === 'superadmin'. */
function AdminRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) return <div className="page-container">Cargando...</div>;

  if (!user || user.role !== 'superadmin') return <Navigate to="/" replace />;

  return children;

}



/** Redirige a /login si no hay sesión. */
function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) return <div className="page-container">Cargando...</div>;

  return user ? children : <Navigate to="/login" replace />;

}



function HeaderProfileAvatar() {
  return (
    <svg
      className="figma-header-profile-svg"
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden
    >
      <circle cx="24" cy="24" r="24" className="figma-profile-bg" />
      <circle cx="24" cy="17.5" r="6.25" className="figma-profile-silhouette" />
      <ellipse cx="24" cy="36" rx="11" ry="7.5" className="figma-profile-silhouette" />
    </svg>
  );
}

/** Barra superior: logo, nav central, avatar a cuenta/login, menú móvil. */
function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const profileTo = user ? '/account' : '/login';

  return (
    <header className="app-header figma-header">
      <div className="figma-header-inner">
        <div className="figma-header-logo">
          <Link to="/" className="brand figma-brand" onClick={closeMenu} aria-label="DiagramTec — Inicio">
            <img src="/Diagram(3).png" alt="DiagramTec" className="brand-logo" />
          </Link>
        </div>

        <button
          type="button"
          className="mobile-menu-btn figma-menu-btn"
          onClick={toggleMenu}
          aria-label="Menú móvil"
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={24} strokeWidth={2.5} />
        </button>

        <div className={`figma-header-nav-wrap ${menuOpen ? 'open' : ''}`}>
          <nav className="figma-nav" aria-label="Principal">
            <NavLink to="/designs" onClick={closeMenu}>Diseños</NavLink>
            <span className="figma-nav-divider" aria-hidden />
            <NavLink to="/" end onClick={closeMenu}>Inicio</NavLink>
            <span className="figma-nav-divider" aria-hidden />
            <NavLink to="/classes" onClick={closeMenu}>Clases</NavLink>
            {user?.role === 'superadmin' && (
              <>
                <span className="figma-nav-divider" aria-hidden />
                <NavLink to="/superadmin" onClick={closeMenu}>Superadmin</NavLink>
              </>
            )}
          </nav>

          <div className="figma-header-mobile-extra">
            {user ? (
              <button type="button" className="figma-header-logout-mobile" onClick={() => { logout(); closeMenu(); }}>
                Cerrar sesión
              </button>
            ) : (
              <NavLink className="figma-header-login" to="/login" onClick={closeMenu}>
                Iniciar sesión
              </NavLink>
            )}
          </div>
        </div>

        <Link
          to={profileTo}
          className="figma-header-profile"
          title={user ? 'Mi cuenta' : 'Iniciar sesión'}
          onClick={closeMenu}
          aria-label={user ? 'Mi cuenta' : 'Iniciar sesión'}
        >
          <HeaderProfileAvatar />
        </Link>
      </div>
    </header>
  );
}



/** Contenedor con Header + <main> y definición de todas las rutas. */
function AppShell() {

  const location = useLocation();

  const isEditor = location.pathname.startsWith('/editor');



  return (

    <div className="app-shell">

      <Header />

      <main className={isEditor ? 'main-editor' : 'main-figma'}>

        <Routes>

          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/signup" element={<SignupPage />} />

          <Route path="/recover" element={<RecoverPasswordPage />} />
          <Route path="/reset-password" element={<RecoverPasswordPage />} />

          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

          <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

          <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />

          <Route path="/classes/:id" element={<ProtectedRoute><ClassDetailPage /></ProtectedRoute>} />

          <Route path="/designs" element={<DesignsPage />} />

          <Route path="/editor" element={<EditorPage />} />

          <Route path="/editor/:id" element={<EditorPage />} />

          <Route path="/superadmin" element={<AdminRoute><SuperAdminPage /></AdminRoute>} />

          <Route path="*" element={<NotFoundPage />} />

        </Routes>

      </main>

      {!isEditor ? <Footer /> : null}

    </div>

  );

}



export default function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <AppShell />

      </BrowserRouter>

    </AuthProvider>

  );

}


