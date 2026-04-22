import { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classDesigns, setClassDesigns] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.classes);
      // Load designs for joined classes
      const designsPromises = response.data.classes
        .filter(c => c.joined)
        .map(async (c) => {
          try {
            const designsRes = await api.get(`/classes/${c.id}/designs`);
            return { classId: c.id, designs: designsRes.data.designs };
          } catch (err) {
            return { classId: c.id, designs: [] };
          }
        });
      const designsResults = await Promise.all(designsPromises);
      const designsMap = {};
      designsResults.forEach(({ classId, designs }) => {
        designsMap[classId] = designs;
      });
      setClassDesigns(designsMap);
    } catch (err) {
      setError('No se pudieron cargar las clases');
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/classes', { title, description });
      setMessage(`Clase creada correctamente. Código: ${response.data.class.code}`);
      setTitle('');
      setDescription('');
      loadClasses();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la clase');
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/classes/join', { code: joinCode });
      setMessage(`Te has unido a la clase: ${response.data.class.title}`);
      setJoinCode('');
      loadClasses();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo unirse a la clase');
    }
  };

  const handleCopyDesign = async (designId) => {
    try {
      await api.post(`/designs/${designId}/copy`);
      setMessage('Diseño copiado a tus diseños personales');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo copiar el diseño');
    }
  };

  return (
    <section className="page-container">
      <h1>Clases</h1>
      {user?.role === 'teacher' ? (
        <div className="form-card">
          <h2>Crear clase nueva</h2>
          <form onSubmit={handleCreate}>
            <label>
              Nombre de la clase
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Descripción
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <button className="primary-button" type="submit">Crear clase</button>
          </form>
        </div>
      ) : (
        <div className="form-card">
          <h2>Unirse a una clase</h2>
          <form onSubmit={handleJoin}>
            <label>
              Código de la clase
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required placeholder="Ingresa el código" />
            </label>
            <button className="primary-button" type="submit">Unirme</button>
          </form>
        </div>
      )}

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="cards-grid">
        {classes.map((classItem) => (
          <article key={classItem.id} className="info-card">
            <h3>{classItem.title}</h3>
            <p>{classItem.description || 'Sin descripción'}</p>
            <p className="small-text">Profesor: {classItem.ownerName}</p>
            {classItem.joined ? (
              <>
                <span className="badge">Ya inscrito</span>
                {classDesigns[classItem.id] && classDesigns[classItem.id].length > 0 ? (
                  <div>
                    <h4>Diseños en la clase:</h4>
                    {classDesigns[classItem.id].map((design) => (
                      <div key={design.id} style={{ marginBottom: '0.5rem' }}>
                        <strong>{design.title}</strong> - {design.ownerName}
                        <button className="small-button" onClick={() => handleCopyDesign(design.id)}>Copiar a mis diseños</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="small-text">No hay diseños en esta clase aún.</p>
                )}
              </>
            ) : user?.role === 'teacher' && classItem.ownerId === user.id ? (
              <p className="small-text">Código: {classItem.code}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
