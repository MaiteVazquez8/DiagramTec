/**
 * @typedef {Object} Connection
 * @property {string|number} id
 * @property {string|number} from
 * @property {string|number} to
 */

/**
 * @param {string|number} fromId
 * @param {string|number} toId
 * @param {string|number} [id]
 * @returns {Connection}
 */
export function createConnection(fromId, toId, id) {
  return {
    id: id ?? Date.now(),
    from: fromId,
    to: toId,
  };
}

/**
 * @param {Connection[]} connections
 * @param {string|number} shapeId
 * @returns {Connection[]}
 */
export function removeConnectionsForShape(connections, shapeId) {
  return connections.filter((c) => c.from !== shapeId && c.to !== shapeId);
}

/**
 * Alterna el origen de conexión o crea una nueva arista.
 * @param {Connection[]} connections
 * @param {string|number|null} connectSource
 * @param {string|number} targetId
 * @returns {{ connections: Connection[], connectSource: string|number|null }}
 */
export function handleConnectClick(connections, connectSource, targetId) {
  if (!connectSource) {
    return { connections, connectSource: targetId };
  }
  if (connectSource === targetId) {
    return { connections, connectSource: null };
  }
  return {
    connections: [...connections, createConnection(connectSource, targetId)],
    connectSource: null,
  };
}
