import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-brand-section">
        <div className="footer-brand">
          <img src="/diagram.png" alt="DiagramTec" className="footer-logo" />
          <div className="footer-socials">
            <a href="https://www.facebook.com" title="Facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden><path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.2-1.5 1.5-1.5h1.6V4.6c-.3 0-1.2-.1-2.4-.1-2.3 0-3.8 1.4-3.8 3.9v2.2H8v3.1h2.4v8h3.1z" fill="currentColor" /></svg>
            </a>
            <a href="https://www.linkedin.com" title="LinkedIn" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden><path d="M6.9 8.3a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM5.3 19.5h3.2V9.8H5.3v9.7zM13.6 9.8h-3v9.7h3.1v-4.8c0-1.3.3-2.5 1.9-2.5s1.6 1.4 1.6 2.6v4.7h3.2v-5.3c0-2.6-.6-4.7-3.6-4.7-1.4 0-2.4.8-2.8 1.6h-.1v-1.3z" fill="currentColor" /></svg>
            </a>
            <a href="https://www.youtube.com" title="YouTube" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" aria-hidden><path d="M21.6 7.4a2.8 2.8 0 0 0-2-2c-1.8-.5-9.2-.5-9.2-.5s-7.3 0-9.2.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0-1 12a29 29 0 0 0 .2 4.6 2.8 2.8 0 0 0 2 2c1.9.5 9.2.5 9.2.5s7.4 0 9.2-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .3-4.6 29 29 0 0 0-.3-4.6zM9.5 15.6V8.4l6 3.6-6 3.6z" fill="currentColor" /></svg>
            </a>
            <a href="https://www.instagram.com/diagramtec/" title="Instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm10.5 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="currentColor" /></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-content">
        <div className="footer-section footer-separator">
          <h3>Ayuda</h3>
          <ul>
            <li>
              <a href="mailto:diagramtec@gmail.com" title="Enviar email a soporte">
                diagramtec@gmail.com
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Links</h3>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/classes">Mis clases</Link></li>
            <li><Link to="/editor">Agregar diseño</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Redes</h3>
          <ul>
            <li><a href="https://www.instagram.com/diagramtec/" title="Instagram" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
