import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function HomePage() {
  const { user } = useAuth();
  return (
    <section className="page-container landing-page">
      <article className="hero-card home-hero">
        <p className="section-eyebrow">TecDiagram</p>
        <h1>Bienvenido a TecDiagram</h1>
        <p>
          La plataforma moderna para crear diagramas de flujo profesionales, guardar tus proyectos
          y colaborar con tu equipo.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/editor">+ Crear diagrama nuevo</Link>
          {!user ? <Link className="secondary-button" to="/login">Ingresar / Registrarse</Link> : null}
        </div>
      </article>

      <div className="cards-grid feature-grid">
        <article className="info-card">
          <p className="feature-icon" aria-hidden>👤</p>
          <h2>Como invitado</h2>
          <p>Explora la plataforma, crea un flujo rápido y prueba la experiencia antes de registrarte.</p>
          <span className="badge">Sin limitaciones para probar</span>
        </article>
        <article className="info-card">
          <p className="feature-icon" aria-hidden>🔐</p>
          <h2>Con cuenta propia</h2>
          <p>Guarda tus diseños, organiza tus clases y accede a tu historial desde tu perfil.</p>
          <span className="badge">Acceso premium</span>
        </article>
        <article className="info-card">
          <p className="feature-icon" aria-hidden>💡</p>
          <h2>Diseños profesionales</h2>
          <p>Construye diagramas con componentes avanzados, conexiones automaticas y exportacion a imagen.</p>
          <span className="badge">Herramientas Pro</span>
        </article>
      </div>

      <div className="quick-actions">
        <h3>Listo para empezar?</h3>
        <div className="action-links">
          <Link className="card-link" to="/editor">Nuevo diagrama</Link>
          <Link className="card-link" to="/designs">Mis diseños</Link>
          <Link className="card-link" to="/classes">Mis clases</Link>
        </div>
      </div>
    </section>
  );
}
