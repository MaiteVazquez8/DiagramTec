import { createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken } from './api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('tecdiagram_token') || '');

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

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('tecdiagram_token', newToken);
  };

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

export function useAuth() {
  return useContext(AuthContext);
}
