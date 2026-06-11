/** Página 404 para rutas no definidas. */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../ToastContext.jsx';

export default function NotFoundPage() {
  const { showError } = useToast();

  useEffect(() => {
    showError('La página que buscas no existe (404)');
  }, [showError]);

  return (
    <section className="page-container form-card">
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <Link className="primary-button" to="/">Volver al inicio</Link>
    </section>
  );
}
