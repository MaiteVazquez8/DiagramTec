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
            <li>
              <a href="mailto:support@diagramtec.com" className="icon-link" title="Enviar email">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
            </li>
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
            <li>
              <a href="https://instagram.com/diagramtec" className="icon-link" title="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 DiagramTec. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
