/** Miniatura de una forma en la paleta del sidebar del editor. */
import Icon from '../../components/Icon.jsx';
import RenderShape from '../../components/RenderShape.jsx';
import { createShape } from '../models/shape.js';
import { SHAPE_TYPES } from '../constants/palette.js';

/**
 * Vista previa de una figura para la paleta lateral.
 * CONNECT muestra un icono; el resto renderiza la figura real en miniatura.
 * @param {{ type: string }} props
 */
export default function ShapePreview({ type }) {
  // Herramienta de conexión: icono en lugar de figura geométrica
  if (type === SHAPE_TYPES.CONNECT) {
    return (
      <div className="connect-preview">
        <Icon name="connect" size={28} strokeWidth={2.5} style={{ color: '#000' }} />
      </div>
    );
  }
  // Demás tipos: figura de ejemplo en posición (0,0) con id 'preview'
  return <RenderShape shape={createShape(type, 0, 0, 'preview')} />;
}
