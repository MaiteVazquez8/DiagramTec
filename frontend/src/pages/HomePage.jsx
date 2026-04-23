import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const DiagramIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ShapesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

export default function HomePage() {
  const { user } = useAuth();
  return (
    <section className="page-container" id="home-page">
      <div className="hero-card">
        <h1>Bienvenido a TecDiagram</h1>
        <p>Una plataforma para crear diagramas de flujo de datos, guardar proyectos, trabajar con clases y usuarios invitados.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/editor">Crear un diseño nuevo</Link>
          {!user ? <Link className="secondary-button" to="/login">Ingresar / Registrarse</Link> : null}
        </div>
      </div>

      <div className="info-grid">
        <article>
          <h2>Invitado</h2>
          <p>Puedes navegar por la página de inicio, ver cómo funciona el sistema, y empezar a crear un nuevo proyecto.</p>
        </article>
        <article>
          <h2>Cuenta</h2>
          <p>Si no estás logueado, mi cuenta y clases te mandarán al login. Después de entrar, tendrás acceso a tu perfil, clases y diseños.</p>
        </article>
        <article>
          <h2>Diseños</h2>
          <p>Accede a tus diseños guardados o crea uno nuevo con la herramienta de arrastre y exportación a imagen.</p>
        </article>
      </div>

      <div className="action-links">
        <Link className="card-link" to="/account">Mi cuenta</Link>
        <Link className="card-link" to="/classes">Clases</Link>
        <Link className="card-link" to="/designs">Diseños</Link>
      </div>
    </section>
  );
}
