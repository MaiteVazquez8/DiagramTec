import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import ClassesPage from './pages/ClassesPage.jsx';
import ClassDetailPage from './pages/ClassDetailPage.jsx';
import DesignsPage from './pages/DesignsPage.jsx';
import EditorPage from './pages/EditorPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-container">Cargando...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="app-header">
      <div className="brand">TecDiagram</div>
      <nav>
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/designs">Diseños</NavLink>
        {user ? <NavLink to="/classes">Clases</NavLink> : null}
        {user ? <NavLink to="/account">Mi cuenta</NavLink> : null}
      </nav>
      <div className="header-actions">
        {user ? (
          <>
            <span className="user-chip">{user.firstName} {user.lastName}</span>
            <button className="small-button" onClick={logout}>Cerrar sesión</button>
          </>
        ) : (
          <NavLink className="small-button" to="/login">Ingresar</NavLink>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main>
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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
