/** Paleta lateral del editor: arrastrar formas y modo conectar. */
import { useRef } from 'react';

import Icon from './Icon';

import { palette } from '../design';



export default function EditorSidebar({ sidebarOpen, setSidebarOpen, handleDragStart, handleTouchEnd, renderPreview, handlePaletteClick, connectMode }) {

  const paletteTouchPlacedRef = useRef(false);



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

          <Icon name="chevronRight" size={22} className="figma-sidebar-toggle-icon" />

        ) : (

          <Icon name="chevronLeft" size={22} className="figma-sidebar-toggle-icon" />

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


