import { useRef } from 'react';
import Icon from './Icon';
import { palette } from '../design';

export default function EditorSidebar({ sidebarOpen, setSidebarOpen, handleDragStart, handleTouchEnd, renderPreview, handlePaletteClick, connectMode }) {
  const paletteTouchPlacedRef = useRef(false);
  // barra lateral que contiene las figuras del diagrama
  return (
    <aside className={`editor-sidebar-fs figma-editor-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      {/* boton para abrir o cerrar el panel lateral */}
      <button 
        className="sidebar-toggle-btn" 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
        title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'} 
        id="btn-toggle-sidebar"
      >
        {sidebarOpen ? <Icon name="chevronLeft" /> : <Icon name="chevronRight" />}
      </button>
      <div className="sidebar-content-scroll">
        {/* encabezado de la seccion de figuras */}
        <div className="sidebar-header-fs">
          <h2>Diseños DFD</h2>
          <p>Arrastra para usar</p>
        </div>
        {/* lista de figuras disponibles en la paleta */}
        <div className="shapes-palette-fs">
          {palette.map((item) => (
            <div key={item.type} className="palette-item-fs">
              <span className="shape-label">{item.label}</span>
              {/* condicional para manejar la herramienta de conexion o figuras */}
              {item.type === 'connect' ? (
                <div 
                  className={`shape-wrapper connect-action ${connectMode ? 'active' : ''}`} 
                  onClick={() => handlePaletteClick(item.type)}
                >
                  {renderPreview(item.type)}
                </div>
              ) : (
                <div 
                  className="shape-wrapper drag-source" 
                  draggable 
                  onDragStart={(event) => handleDragStart(event, item.type)}
                  onTouchEnd={(event) => {
                    if (handleTouchEnd(event, item.type)) {
                      paletteTouchPlacedRef.current = true;
                    }
                  }}
                  onClick={() => {
                    if (paletteTouchPlacedRef.current) {
                      paletteTouchPlacedRef.current = false;
                      return;
                    }
                    if (window.matchMedia('(pointer: coarse)').matches) {
                      handleTouchEnd(
                        { changedTouches: [{ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }] },
                        item.type
                      );
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
