import { createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken } from './api.js';

const AuthContext = createContext();

// proveedor del contexto de autenticacion para toda la app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('tecdiagram_token') || '');

  // efecto para validar el token y obtener los datos del usuario
  useEffect(() => {
    if (!token) {
      setAuthToken(null);
      setUser(null);
      setLoading(false);
      localStorage.removeItem('tecdiagram_token');
      return;
    }

    setAuthToken(token);
    api.get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        setUser(null);
        setToken('');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // funcion para iniciar sesion y guardar el token
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('tecdiagram_token', newToken);
  };

  // funcion para cerrar sesion y limpiar datos locales
  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('tecdiagram_token');
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// hook para acceder facilmente al contexto de autenticacion
export function useAuth() {
  return useContext(AuthContext);
}
