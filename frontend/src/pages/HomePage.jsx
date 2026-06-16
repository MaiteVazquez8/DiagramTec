/** Página de inicio (ruta /). Enlaces al editor, diseños y clases según sesión. */
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Icon from '../components/Icon.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const heroActions = [
    { to: '/editor', label: 'Crear diseño' },
    { to: '/editor', label: 'Cómo empezar' },
    { to: '/designs', label: 'DiagramTec' },
    { to: '/designs', label: 'Ver diseños' },
    { to: '/classes', label: 'Unirse a clases' },
  ];

  return (
    <section className="page-container figma-home-page">
      <article className="figma-home-hero">
        <h1>Bienvenido a DiagramTec</h1>
        <p>
          La plataforma moderna para crear diagramas de flujo de datos de forma intuitiva, guardar
          tus proyectos y participar en clases.
        </p>
        <div className="figma-home-auth-actions">
          {!user ? <Link className="primary-button figma-home-login-button" to="/login">+ Iniciar sesión</Link> : null}
          {!user ? <Link className="primary-button figma-home-register-button" to="/signup">+ Registrarse</Link> : null}
        </div>
      </article>

      <div className="figma-home-shortcuts">
        {heroActions.map((action) => (
          <article className="figma-mini-card" key={action.label}>
            <div className="figma-mini-card-media" aria-hidden>
              <Icon name="image" size={64} />
            </div>
            <Link className="primary-button figma-mini-card-button" to={action.to}>+ {action.label}</Link>
          </article>
        ))}
      </div>

      <section className="figma-home-block">
        <h2>Cómo empezar</h2>
        <p>
          Configura tu perfil, crea tu primer diagrama y colabora con tu equipo. Una guía rápida
          diseñada para que aproveches al máximo todas nuestras funciones de modelado y gestión académica.
        </p>
        <div className="figma-video-placeholder">
          <button className="primary-button figma-video-button" type="button">+ Video / Tutorial</button>
        </div>
      </section>

      <section className="figma-home-block">
        <h2>DiagramTec</h2>
        <div className="figma-about-grid">
          <div>
            <h3>¿Quiénes somos?</h3>
            <p>
              Somos un equipo de desarrollo perteneciente a la E.E.S.T. N°1 de Monte Grande,
              especializado en la orientación de Programación. Nuestro proyecto, Diagram Tec,
              nace bajo la supervisión del profesor Diego Callamullo con el firme propósito de
              modernizar las herramientas de aprendizaje técnico dentro de nuestra institución.
            </p>
            <p>Nuestro equipo esta conformado por:</p>
            <ul>
              <li><strong>Líder Back-End:</strong> Maite Vazquez.</li>
              <li><strong>Marketing:</strong> Nayla Gomez.</li>
              <li><strong>Desarrollo de Front-End:</strong> Santiago Alvarez y Leandro Pereyra.</li>
              <li><strong>Documentación y Base de Datos:</strong> Joaquin Villalva.</li>
            </ul>
            <p>
              <strong>Nuestro objetivo</strong><br />
              En el ámbito educativo actual, la representación visual de procesos es fundamental.
              Diagram Tec tiene como objetivo principal proporcionar una plataforma digital interactiva
              que facilite la creación, gestión y edición de Diagramas de Flujo de Datos (DFD).
              Buscamos transformar la enseñanza tradicional en una experiencia dinámica, accesible
              y eficiente para toda la comunidad del Tecnológico.
            </p>
            <p>
              <strong>¿Qué nos diferencia?</strong><br />
              Nuestra plataforma no es solo un editor de diagramas; es un ecosistema educativo
              diseñado para potenciar el análisis de sistemas.
            </p>
            <p><strong>La identidad de DiagramTec</strong><br />
              El nombre Diagram Tec simboliza nuestra esencia: la combinación de la funcionalidad
              técnica de los diagramas con la identidad de nuestra escuela.
            </p>
          </div>
          <div className="figma-about-logo-wrap">
            <img src="/logoDT.png" alt="Logo DiagramTec" className="figma-about-logo" />
          </div>
        </div>
      </section>

      <div className="figma-home-back-to-top-wrap">
        <button
          className="figma-home-back-to-top"
          type="button"
          onClick={scrollToTop}
          aria-label="Subir hasta arriba"
          title="Subir hasta arriba"
        >
          <Icon name="arrowUp" size={22} />
        </button>
      </div>
    </section>
  );
}
