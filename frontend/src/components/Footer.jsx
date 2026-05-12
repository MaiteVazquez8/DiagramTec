export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Ayuda</h3>
          <ul>
            <li><a href="#docs">Documentación</a></li>
            <li><a href="#faq">Preguntas frecuentes</a></li>
            <li><a href="#support">Soporte</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Links</h3>
          <ul>
            <li><a href="#about">Acerca de nosotros</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#pricing">Planes</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Redes</h3>
          <ul>
            <li><a href="#github">GitHub</a></li>
            <li><a href="#twitter">Twitter</a></li>
            <li><a href="#linkedin">LinkedIn</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 DiagramTec. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
