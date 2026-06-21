/**
 * Punto de entrada de la aplicación React.
 * Monta el árbol de componentes en el DOM y carga estilos globales.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Crea la raíz de React y renderiza App dentro de StrictMode
// (StrictMode ejecuta efectos dos veces en desarrollo para detectar efectos secundarios)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
