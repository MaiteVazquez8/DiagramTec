import { ellipseBorderScale, rectBorderScale, shapeCenter, vectorLength } from './geometry.js';
import { SHAPE_TYPES } from '../constants/palette.js';

/**
 * @typedef {{ x1: number, y1: number, x2: number, y2: number }} ConnectionLine
 */

/**
 * Calcula los extremos de una línea de conexión entre dos figuras (borde a borde).
 * @param {import('../models/shape.js').Shape} from
 * @param {import('../models/shape.js').Shape} to
 * @returns {ConnectionLine | null}
 */
export function getConnectionLine(from, to) {
  const fromCenter = shapeCenter(from);
  const toCenter = shapeCenter(to);

  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const dist = vectorLength(dx, dy);

  if (dist === 0) return null;

  const borderScale = (shape) => {
    if (shape.type === SHAPE_TYPES.START || shape.type === SHAPE_TYPES.END) {
      return ellipseBorderScale(shape, dx, dy, dist);
    }
    return rectBorderScale(shape, absDx, absDy);
  };

  const fromScale = borderScale(from);
  const toScale = borderScale(to);

  return {
    x1: fromCenter.x + dx * fromScale,
    y1: fromCenter.y + dy * fromScale,
    x2: toCenter.x - dx * toScale,
    y2: toCenter.y - dy * toScale,
  };
}

/**
 * @param {import('../models/connection.js').Connection} connection
 * @param {Map<string, import('../models/shape.js').Shape>} shapesById
 * @returns {ConnectionLine | null}
 */
export function getConnectionLineFromMap(connection, shapesById) {
  const from = shapesById.get(connection.from);
  const to = shapesById.get(connection.to);
  if (!from || !to) return null;
  return getConnectionLine(from, to);
}
