import Icon from './Icon';
import { palette } from './EditorUI';

export default function EditorSidebar({ sidebarOpen, setSidebarOpen, handleDragStart, handleTouchEnd, renderPreview, handlePaletteClick, connectMode }) {
  // barra lateral que contiene las figuras del diagrama
  return (
    <aside className={`editor-sidebar-fs ${sidebarOpen ? 'open' : 'collapsed'}`}>
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
                  onTouchEnd={(event) => handleTouchEnd(event, item.type)}
                  onClick={() => {
                    // fallback para moviles: click para añadir al centro
                    if (window.innerWidth <= 768) {
                      const rect = document.querySelector('.canvas-zoom-layer').getBoundingClientRect();
                      const x = (window.innerWidth / 2 - rect.left) / 1 - 20;
                      const y = (window.innerHeight / 2 - rect.top) / 1 - 20;
                      handleTouchEnd({ changedTouches: [{ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }] }, item.type);
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
