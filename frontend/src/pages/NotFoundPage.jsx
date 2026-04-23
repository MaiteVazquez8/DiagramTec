import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="page-container form-card">
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <Link className="primary-button" to="/">Volver al inicio</Link>
    </section>
  );
}
