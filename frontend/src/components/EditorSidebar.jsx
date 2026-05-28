/** Paleta lateral del editor: arrastrar formas y modo conectar. */
import { useRef } from 'react';

import Icon from './Icon';

import { palette } from '../design';

export default function EditorSidebar({
  sidebarOpen,
  setSidebarOpen,
  onPaletteDragStart,
  onPaletteTapPlace,
  renderPreview,
  handlePaletteClick,
  connectMode,
}) {
  const palettePlacedRef = useRef(false);

  const markPlaced = () => {
    palettePlacedRef.current = true;
  };

  return (
    <aside className={`editor-sidebar-fs figma-editor-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
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
                <div
                  className={`shape-wrapper connect-action ${connectMode ? 'active' : ''}`}
                  onClick={() => {
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
                <div
                  className="shape-wrapper drag-source"
                  onMouseDown={(event) => onPaletteDragStart(event, item.type, markPlaced)}
                  onTouchStart={(event) => onPaletteDragStart(event, item.type, markPlaced)}
                  onClick={() => {
                    if (palettePlacedRef.current) {
                      palettePlacedRef.current = false;
                      return;
                    }
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
