import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function DesignsPage() {
  const { user } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState('');

  const loadDesigns = async () => {
    try {
      const response = await api.get('/designs');
      setDesigns(response.data.designs);
    } catch (err) {
      setError('No se pudieron cargar los diseños');
    }
  };

  useEffect(() => {
    if (user) {
      loadDesigns();
    }
  }, [user]);

  return (
    <section className="page-container">
      <div className="hero-card">
        <h1>Mis diseños</h1>
        <p>Todos los diseños guardados desde la aplicación.</p>
        <Link className="primary-button" to="/editor">Crear diseño nuevo</Link>
      </div>
      {!user ? (
        <div className="info-card">
          <h3>Modo invitado</h3>
          <p>Para guardar y ver tus diseños, inicia sesión o crea una cuenta.</p>
        </div>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      <div className="cards-grid">
        {user ? (
          designs.length === 0 ? (
            <div className="info-card">
              <h3>No hay diseños guardados</h3>
              <p>Crea un nuevo proyecto para que aparezca en tu lista.</p>
            </div>
          ) : (
            designs.map((design) => (
              <article key={design.id} className="info-card">
                <h3>{design.title}</h3>
                <p className="small-text">Creado: {new Date(design.createdAt).toLocaleString()}</p>
                <p className="small-text">Propietario: {design.ownerName}</p>
                {design.isClassDesign ? <span className="badge">Clase</span> : null}
                {design.isCopy ? <span className="badge">Copia</span> : null}
                <Link className="secondary-button" to={`/editor/${design.id}`}>Editar</Link>
              </article>
            ))
          )
        ) : null}
      </div>
    </section>
  );
}
