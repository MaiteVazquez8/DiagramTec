import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, classes: 0, designs: 0, teachers: 0, students: 0 });
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, classesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/classes')
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setClasses(classesRes.data.classes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchData();
      } catch (err) {
        alert('Error al eliminar usuario');
      }
    }
  };

  const deleteClass = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta clase?')) {
      try {
        await api.delete(`/admin/classes/${id}`);
        fetchData();
      } catch (err) {
        alert('Error al eliminar clase');
      }
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editingUser.id}`, editingUser);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert('Error al actualizar usuario');
    }
  };

  if (loading) return <div className="admin-loading">Cargando panel de administración...</div>;

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'superadmin');

  return (
    <div className="superadmin-container">
      {/* HEADER PREMIUM */}
      <header className="admin-top-bar">
        <nav className="admin-nav-links">
          <a href="#alumnos" onClick={(e) => { e.preventDefault(); scrollToSection('alumnos'); }}>gest de Alumnos</a>
          <a href="#profesores" onClick={(e) => { e.preventDefault(); scrollToSection('profesores'); }}>gest de Profesores</a>
          <a href="#clases" onClick={(e) => { e.preventDefault(); scrollToSection('clases'); }}>gest de clases</a>
        </nav>
      </header>

      <div className="admin-body-wrapper">
        <SuperAdminSidebar />
        
        <main className="admin-main-content">
          
          {/* GESTIÓN DE ALUMNOS ROW */}
          <section id="alumnos">
            <div className="admin-section-header">
              <h2 className="admin-section-title">gestión de Alumnos</h2>
              <a href="#tabla-usuarios" className="ver-todo" onClick={(e) => { e.preventDefault(); scrollToSection('tabla-usuarios'); }}>Ver todo &gt;</a>
            </div>
            <div className="admin-cards-row">
              {students.slice(0, 6).map(u => (
                <div key={u.id} className="admin-user-card">
                  <div className="user-card-avatar">
                    {u.firstName?.[0]}
                  </div>
                  <p>{u.firstName} {u.lastName?.[0]}.</p>
                  <button className="info-btn-rect" onClick={() => setEditingUser(u)}>INFO</button>
                </div>
              ))}
            </div>
          </section>

          {/* GESTIÓN DE PROFESORES ROW */}
          <section id="profesores">
            <div className="admin-section-header">
              <h2 className="admin-section-title">gestión de Profesores</h2>
              <a href="#tabla-usuarios" className="ver-todo" onClick={(e) => { e.preventDefault(); scrollToSection('tabla-usuarios'); }}>Ver todo &gt;</a>
            </div>
            <div className="admin-cards-row">
              {teachers.slice(0, 6).map(u => (
                <div key={u.id} className="admin-user-card">
                  <div className="user-card-avatar" style={{background: 'rgba(129, 0, 0, 0.1)', color: '#810000'}}>
                    {u.firstName?.[0]}
                  </div>
                  <p>{u.firstName} {u.lastName?.[0]}.</p>
                  {u.role !== 'superadmin' && (
                    <button className="info-btn-rect" onClick={() => setEditingUser(u)}>INFO</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* GESTIÓN DE CLASES ROW */}
          <section id="clases">
            <div className="admin-section-header">
              <h2 className="admin-section-title">gestión de clases</h2>
              <a href="#tabla-clases" className="ver-todo" onClick={(e) => { e.preventDefault(); scrollToSection('tabla-clases'); }}>Ver todo &gt;</a>
            </div>
            <div className="admin-cards-row">
              {classes.slice(0, 6).map(c => (
                <div key={c.id} className="admin-class-card" onClick={() => navigate(`/classes/${c.id}`)} style={{cursor: 'pointer'}}>
                  <p className="class-title">{c.title}</p>
                  <p className="class-prof">{c.ownerName}</p>
                </div>
              ))}
            </div>
          </section>

          {/* TABLA CLASES */}
          <section className="admin-table-block" id="tabla-clases">
            <h2>gestión de clases (Q)</h2>
            <div className="sketch-table-wrapper">
              <table className="sketch-table">
                <thead>
                  <tr>
                    <th>Nombre clase</th>
                    <th>nom PROFe</th>
                    <th>Código</th>
                    <th>Cont Alumnos</th>
                    <th className="action-cell">ELIMINAR</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(c => (
                    <tr key={c.id}>
                      <td>{c.title}</td>
                      <td>{c.ownerName}</td>
                      <td><strong>{c.code}</strong></td>
                      <td>{c.studentCount}</td>
                      <td className="action-cell">
                        <button className="sketch-icon-btn" onClick={() => deleteClass(c.id)}>
                          <Icon name="close" strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* TABLA USUARIOS */}
          <section className="admin-table-block" id="tabla-usuarios">
            <h2>gestión de Alumnos / Profesores (Q)</h2>
            <div className="sketch-table-wrapper">
              <table className="sketch-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Rol</th>
                    <th className="action-cell">Modificar</th>
                    <th className="action-cell">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{color: '#666'}}>{u.email}</td>
                      <td>{u.firstName}</td>
                      <td>{u.lastName}</td>
                      <td><span style={{fontWeight: 800, color: u.role === 'superadmin' ? '#dc2626' : u.role === 'teacher' ? '#d97706' : '#16a34a'}}>{u.role === 'superadmin' ? 'ADMIN' : u.role === 'teacher' ? 'PROFESOR' : 'ALUMNO'}</span></td>
                      <td className="action-cell">
                        {u.role !== 'superadmin' && (
                          <button className="sketch-icon-btn" onClick={() => setEditingUser(u)}>
                            <Icon name="edit" strokeWidth={2.5} />
                          </button>
                        )}
                      </td>
                      <td className="action-cell">
                        {u.role !== 'superadmin' && u.id !== user.id && (
                          <button className="sketch-icon-btn" onClick={() => deleteUser(u.id)}>
                            <Icon name="close" strokeWidth={2.5} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </main>
      </div>

      {editingUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-card-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <h3 style={{margin: 0, fontSize: '1.4rem', fontWeight: 900}}>Modificar Usuario</h3>
              <button className="close-modal-btn" onClick={() => setEditingUser(null)}>
                <Icon name="close" size={20} strokeWidth={2.5} />
              </button>
            </div>
            <form className="admin-edit-form" onSubmit={handleUpdateUser} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
              <div className="form-row" style={{display: 'flex', gap: '1rem'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Nombre</label>
                  <input value={editingUser.firstName} onChange={e => setEditingUser({ ...editingUser, firstName: e.target.value })} style={{width: '100%'}}/>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Apellido</label>
                  <input value={editingUser.lastName} onChange={e => setEditingUser({ ...editingUser, lastName: e.target.value })} style={{width: '100%'}}/>
                </div>
              </div>
              <div className="form-group">
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Email</label>
                <input value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} style={{width: '100%'}}/>
              </div>
              <div className="form-group">
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Rol</label>
                <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} style={{width: '100%'}}>
                  <option value="student">Alumno</option>
                  <option value="teacher">Profesor</option>
                </select>
              </div>
              <div className="admin-modal-footer" style={{marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                <button type="button" className="admin-btn-cancel" onClick={() => setEditingUser(null)}>Cancelar</button>
                <button type="submit" className="admin-btn-save">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
