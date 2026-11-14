/**
 * Shell de la aplicación: proveedor de auth, router y layout común.
 * - Header con navegación Figma (Diseños | Inicio | Clases | Superadmin)
 * - Rutas públicas, protegidas (login) y admin (superadmin)
 * - El editor usa main.main-editor; el resto main.main-figma
 */
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';

import { BrowserRouter, Routes, Route, NavLink, Navigate, Link, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './AuthContext.jsx';
import { ToastProvider, useToast } from './ToastContext.jsx';
import api from './api.js';
import Footer from './components/Footer.jsx';
import Icon from './components/Icon.jsx';
import ProfileSilhouette from './components/ProfileSilhouette.jsx';
import { RouteGuardSkeleton } from './components/skeletons/PageSkeletons.jsx';

// La portada se carga de inmediato; el resto de páginas se descargan solo al visitarlas
// (code splitting). Así el editor, html2canvas y jsPDF no frenan la primera carga.
import HomePage from './pages/HomePage.jsx';

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'));
const ClassesPage = lazy(() => import('./pages/ClassesPage.jsx'));
const ClassDetailPage = lazy(() => import('./pages/ClassDetailPage.jsx'));
const ClassMembersPage = lazy(() => import('./pages/ClassMembersPage.jsx'));
const DesignsPage = lazy(() => import('./pages/DesignsPage.jsx'));
const EditorPage = lazy(() => import('./pages/EditorPage.jsx'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage.jsx'));
const SuperAdminStudentsPage = lazy(() => import('./pages/SuperAdminStudentsPage.jsx'));
const SuperAdminTeachersPage = lazy(() => import('./pages/SuperAdminTeachersPage.jsx'));
const SuperAdminClassesPage = lazy(() => import('./pages/SuperAdminClassesPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const RecoverPasswordPage = lazy(() => import('./pages/RecoverPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx'));





/** Solo usuarios con role === 'superadmin'. */
function AdminRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) return <RouteGuardSkeleton />;

  if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  return children;

}



/** Redirige a /login si no hay sesión. */
function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) return <RouteGuardSkeleton />;

  return user ? children : <Navigate to="/login" replace />;

}



function HeaderProfileAvatar() {
  return <ProfileSilhouette size={44} className="figma-header-profile-svg" />;
}

/** Barra superior: logo, nav central, avatar a cuenta/login, menú móvil. */
function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const headerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isSuperAdminPanel = location.pathname.startsWith('/superadmin');

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const profileTo = !user ? '/login' : isSuperAdmin ? '/superadmin' : '/account';
  const profileLabel = !user ? 'Iniciar sesión' : isSuperAdmin ? 'Panel superadmin' : 'Mi cuenta';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('mobile-menu-open');

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('mobile-menu-open');
    };
  }, [menuOpen]);

  const navLinks = (
    <nav className="figma-nav" aria-label={isSuperAdminPanel ? 'Administración' : 'Principal'}>
      {isSuperAdminPanel ? (
        <>
          <NavLink to="/superadmin/alumnos" onClick={closeMenu}>Gestión de alumnos</NavLink>
          <span className="figma-nav-divider" aria-hidden />
          <NavLink to="/superadmin/profesores" onClick={closeMenu}>Gestión de profesores</NavLink>
          <span className="figma-nav-divider" aria-hidden />
          <NavLink to="/superadmin/clases" onClick={closeMenu}>Gestión de clases</NavLink>
        </>
      ) : (
        <>
          <NavLink to="/designs" onClick={closeMenu}>Diseños</NavLink>
          <span className="figma-nav-divider" aria-hidden />
          <NavLink to="/" end onClick={closeMenu}>Inicio</NavLink>
          <span className="figma-nav-divider" aria-hidden />
          <NavLink to="/classes" onClick={closeMenu}>Clases</NavLink>
          {(user?.role === 'superadmin' || user?.role === 'admin') && (
            <>
              <span className="figma-nav-divider" aria-hidden />
              <NavLink to="/superadmin" onClick={closeMenu}>Superadmin</NavLink>
            </>
          )}
        </>
      )}
    </nav>
  );

  return (
    <header ref={headerRef} className={`app-header figma-header${menuOpen ? ' figma-header--menu-open' : ''}`}>
      <div className="figma-header-inner">
        <div className="figma-header-logo">
          <Link to="/" className="brand figma-brand" onClick={closeMenu} aria-label="DiagramTec — Inicio">
            <img src="/logo.webp" alt="DiagramTec" className="brand-logo" width="480" height="240" decoding="async" fetchpriority="high" />
          </Link>
        </div>

        <button
          type="button"
          className={`mobile-menu-btn figma-menu-btn${menuOpen ? ' figma-menu-btn--open' : ''}`}
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="figma-header-mobile-nav"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={22} strokeWidth={2.5} />
        </button>

        <div className="figma-header-nav-wrap figma-header-nav-wrap--desktop">
          {navLinks}
        </div>

        <Link
          to={profileTo}
          className="figma-header-profile"
          title={profileLabel}
          onClick={closeMenu}
          aria-label={profileLabel}
        >
          <HeaderProfileAvatar />
        </Link>
      </div>

      {menuOpen ? (
        <div className="figma-header-mobile-menu" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <button
            type="button"
            className="figma-header-overlay"
            onClick={closeMenu}
            aria-label="Cerrar menú"
            tabIndex={-1}
          />
          <div id="figma-header-mobile-nav" className="figma-header-mobile-panel">
            <div className="figma-header-mobile-panel__nav">
              {navLinks}
            </div>
            {user ? (
              <button
                type="button"
                className="figma-header-logout-mobile"
                onClick={() => { logout(); closeMenu(); }}
              >
                Cerrar sesión
              </button>
            ) : (
              <NavLink className="figma-header-login figma-header-login--mobile" to="/login" onClick={closeMenu}>
                Iniciar sesión
              </NavLink>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}



/** Contenedor con Header + <main> y definición de todas las rutas. */
function AppShell() {

  const location = useLocation();

  const isEditor = location.pathname.startsWith('/editor');
  const isSuperAdmin = location.pathname.startsWith('/superadmin');

  let mainClass = 'main-figma';
  if (isEditor) mainClass = 'main-editor';
  else if (isSuperAdmin) mainClass = 'main-figma main-superadmin';

  return (

    <div className={`app-shell${isSuperAdmin ? ' app-shell--superadmin' : ''}`}>

      <Header />

      <VerifyEmailBanner />

      <main className={mainClass}>

        <Suspense fallback={<RouteGuardSkeleton />}>
        <Routes>

          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/signup" element={<SignupPage />} />

          <Route path="/recover" element={<RecoverPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacidad" element={<PrivacyPage />} />

          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

          <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

          <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />

          <Route path="/classes/:id/members" element={<ProtectedRoute><ClassMembersPage /></ProtectedRoute>} />

          <Route path="/classes/:id" element={<ProtectedRoute><ClassDetailPage /></ProtectedRoute>} />

          <Route path="/designs" element={<DesignsPage />} />

          <Route path="/editor" element={<EditorPage />} />

          <Route path="/editor/:id" element={<EditorPage />} />

          <Route path="/superadmin" element={<AdminRoute><SuperAdminPage /></AdminRoute>} />

          <Route path="/superadmin/alumnos" element={<AdminRoute><SuperAdminStudentsPage /></AdminRoute>} />

          <Route path="/superadmin/profesores" element={<AdminRoute><SuperAdminTeachersPage /></AdminRoute>} />

          <Route path="/superadmin/clases" element={<AdminRoute><SuperAdminClassesPage /></AdminRoute>} />

          <Route path="*" element={<NotFoundPage />} />

        </Routes>
        </Suspense>

      </main>

      {!isEditor ? <Footer /> : null}

    </div>

  );

}



/** Aviso para cuentas sin email verificado (o con un cambio de email pendiente). */
function VerifyEmailBanner() {
  const { user } = useAuth();
  const { showMessage } = useToast();
  const [sending, setSending] = useState(false);
  if (!user || (user.emailVerified && !user.pendingEmail)) return null;

  const resend = async () => {
    setSending(true);
    try {
      const response = await api.post('/auth/resend-verification');
      showMessage(response.data?.message || 'Te enviamos un enlace nuevo.');
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="verify-email-banner" role="status">
      <span>
        {user.pendingEmail
          ? `Confirmá tu nuevo email (${user.pendingEmail}) desde el enlace que te enviamos.`
          : 'Verificá tu email para usar las clases. Te enviamos un enlace a tu correo.'}
      </span>
      <button type="button" onClick={resend} disabled={sending}>
        {sending ? 'Enviando...' : 'Reenviar enlace'}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}


