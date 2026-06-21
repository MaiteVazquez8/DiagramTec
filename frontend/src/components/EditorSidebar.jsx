/** Paleta lateral del editor: arrastrar formas y modo conectar. */
import { useRef } from 'react';

import Icon from './Icon';

import { palette } from '../design';

/**
 * Panel lateral con la paleta de formas del diagrama.
 * Soporta drag (desktop), tap-to-place (touch) y modo conectar.
 */
export default function EditorSidebar({
  sidebarOpen,
  setSidebarOpen,
  onPaletteDragStart,
  onPaletteTapPlace,
  renderPreview,
  handlePaletteClick,
  connectMode,
}) {
  // Evita doble colocación: drag + click en el mismo gesto
  const palettePlacedRef = useRef(false);

  /** Marca que la forma ya se colocó (p. ej. tras un drag exitoso). */
  const markPlaced = () => {
    palettePlacedRef.current = true;
  };

  return (
    <aside className={`editor-sidebar-fs figma-editor-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      {/* Toggle para mostrar/ocultar el panel lateral */}
      <button
        type="button"
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
        id="btn-toggle-sidebar"
      >
        {sidebarOpen ? (
          <Icon name="chevronRight" size={18} className="figma-sidebar-toggle-icon" />
        ) : (
          <Icon name="chevronLeft" size={18} className="figma-sidebar-toggle-icon" />
        )}
      </button>

      <div className="sidebar-header-fs figma-sidebar-header">
        <h2>Componentes</h2>
        <p>Arrastra para usar</p>
      </div>

      <div className="sidebar-content-scroll figma-sidebar-body">
        <div className="shapes-palette-fs">
          {palette.map((item) => (
            <div key={item.type} className="palette-item-fs">
              <span className="shape-label">{item.label}</span>

              {item.type === 'connect' ? (
                /* Herramienta "conectar": activa/desactiva modo de enlace entre formas */
                <div
                  className={`shape-wrapper connect-action ${connectMode ? 'active' : ''}`}
                  onClick={() => {
                    // En touch, el click lo maneja onTouchEnd para evitar doble disparo
                    if (window.matchMedia('(pointer: coarse)').matches) return;
                    handlePaletteClick(item.type);
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation();
                    if (!window.matchMedia('(pointer: coarse)').matches) return;
                    if (event.cancelable) event.preventDefault();
                    handlePaletteClick(item.type);
                  }}
                >
                  {renderPreview(item.type)}
                </div>
              ) : (
                /* Formas arrastrables: mouse/touch drag o tap en dispositivos táctiles */
                <div
                  className="shape-wrapper drag-source"
                  onMouseDown={(event) => onPaletteDragStart(event, item.type, markPlaced)}
                  onTouchStart={(event) => onPaletteDragStart(event, item.type, markPlaced)}
                  onClick={() => {
                    // Ignora click si acaba de colocarse por drag
                    if (palettePlacedRef.current) {
                      palettePlacedRef.current = false;
                      return;
                    }
                    // En pantallas táctiles: un tap coloca la forma en el lienzo
                    if (window.matchMedia('(pointer: coarse)').matches) {
                      onPaletteTapPlace(item.type);
                      palettePlacedRef.current = true;
                    }
                  }}
                >
                  {renderPreview(item.type)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
