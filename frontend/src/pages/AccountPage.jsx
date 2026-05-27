import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Icon from '../components/Icon.jsx';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState(null);

  const initials = `${user?.firstName || ''} ${user?.lastName || ''}`
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <section className="figma-sector" id="account-page">
      <div className="figma-sector-inner account-layout">
        <aside className="account-sidebar">
          <div className="account-avatar">
            <div className="account-avatar-circle" aria-hidden>
              {initials}
            </div>
            <div className="account-avatar-info">
              <h2>{user?.firstName} {user?.lastName}</h2>
              <p>{user?.email}</p>
              <p className="account-role">{user?.role === 'teacher' ? 'Profesor' : 'Estudiante'}</p>
            </div>
          </div>
          <div className="account-actions">
            <button 
              type="button" 
              className="primary-button account-btn"
              onClick={() => navigate('/edit-profile')}
            >
              <Icon name="edit" size={18} strokeWidth={2} />
              Editar información
            </button>
            <button 
              type="button" 
              className="secondary-button account-btn" 
              onClick={() => setConfirmModal('logout')}
            >
              <Icon name="logout" size={18} strokeWidth={2} />
              Cerrar sesión
            </button>
            <button
              type="button"
              className="danger-button account-btn"
              onClick={() => setConfirmModal('delete')}
            >
              <Icon name="trash" size={18} strokeWidth={2} />
              Eliminar cuenta
            </button>
          </div>
          <button type="button" className="account-help-link">
            <Icon name="help" size={18} strokeWidth={2} />
            Ayuda
          </button>
        </aside>

        <main className="account-main">
          <section className="account-section">
            <header className="account-section-head">
              <h1>Mis diseños</h1>
              <Link to="/designs" className="account-link">Ver todo &gt;</Link>
            </header>
            <div className="account-cards-row">
              <div className="account-card-placeholder figma-dot-pattern" />
              <div className="account-card-placeholder figma-dot-pattern" />
              <div className="account-card-placeholder figma-dot-pattern" />
              <div className="account-card-placeholder figma-dot-pattern" />
              <div className="account-card-placeholder figma-dot-pattern" />
            </div>
          </section>

          <section className="account-section">
            <header className="account-section-head">
              <h1>Mis clases</h1>
              <Link to="/classes" className="account-link">Ver todo &gt;</Link>
            </header>
            <div className="account-cards-row">
              <div className="account-card-placeholder figma-dot-pattern" />
              <div className="account-card-placeholder figma-dot-pattern" />
              <div className="account-card-placeholder figma-dot-pattern" />
              <div className="account-card-placeholder figma-dot-pattern" />
              <div className="account-card-placeholder figma-dot-pattern" />
            </div>
          </section>
        </main>
      </div>

      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button 
              type="button"
              className="modal-close"
              onClick={() => setConfirmModal(null)}
            >
              ✕
            </button>
            <div className="modal-body">
              {confirmModal === 'logout' && (
                <>
                  <p>¿Esta seguro que quiere cerrar sesión?</p>
                  <div className="modal-actions">
                    <button 
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirmModal(null)}
                    >
                      No
                    </button>
                    <button 
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setConfirmModal(null);
                        logout();
                      }}
                    >
                      Si
                    </button>
                  </div>
                </>
              )}
              {confirmModal === 'delete' && (
                <>
                  <p>¿Esta seguro que quiere eliminar su cuenta?</p>
                  <div className="modal-actions">
                    <button 
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirmModal(null)}
                    >
                      No
                    </button>
                    <button 
                      type="button"
                      className="danger-button"
                      onClick={async () => {
                        try {
                          await api.delete('/users/me');
                          logout();
                        } catch (err) {
                          console.error(err);
                          setConfirmModal(null);
                        }
                      }}
                    >
                      Si
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
