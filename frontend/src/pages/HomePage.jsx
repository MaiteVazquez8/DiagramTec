import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function HomePage() {
  const { user } = useAuth();
  return (
    <section className="page-container">
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
