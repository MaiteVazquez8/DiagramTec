/** Miniatura de una forma en la paleta del sidebar. */
import Icon from '../../components/Icon.jsx';
import RenderShape from '../../components/RenderShape.jsx';
import { createShape } from '../models/shape.js';
import { SHAPE_TYPES } from '../constants/palette.js';

/**
 * Vista previa de una figura para la paleta lateral.
 * @param {{ type: string }} props
 */
export default function ShapePreview({ type }) {
  if (type === SHAPE_TYPES.CONNECT) {
    return (
      <div className="connect-preview">
        <Icon name="connect" size={40} strokeWidth={3} style={{ color: '#000' }} />
      </div>
    );
  }
  return <RenderShape shape={createShape(type, 0, 0, 'preview')} />;
}
