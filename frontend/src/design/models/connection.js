/**
 * Conexiones entre formas (clic origen → clic destino) y líneas SVG.
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
/** @param {string|number} id */
export function normalizeEndpointId(id) {
  const n = Number(id);
  return Number.isNaN(n) ? id : n;
}

/**
 * @param {Connection} connection
 * @returns {Connection}
 */
export function normalizeConnection(connection) {
  return {
    ...connection,
    from: normalizeEndpointId(connection.from),
    to: normalizeEndpointId(connection.to),
  };
}

export function createConnection(fromId, toId, id) {
  return {
    id: id ?? Date.now(),
    from: normalizeEndpointId(fromId),
    to: normalizeEndpointId(toId),
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
 * @param {Connection[]} connections
 * @param {string|number} connectionId
 * @returns {Connection[]}
 */
export function removeConnection(connections, connectionId) {
  return connections.filter((c) => c.id !== connectionId);
}

/**
 * Clave única para un par de componentes (sin importar dirección).
 * @param {string|number} a
 * @param {string|number} b
 * @returns {string}
 */
export function getPairKey(a, b) {
  const x = Number(a);
  const y = Number(b);
  return `${Math.min(x, y)}-${Math.max(x, y)}`;
}

/**
 * Indica si ya existe conexión entre dos componentes (en cualquier dirección).
 * @param {Connection[]} connections
 * @param {string|number} fromId
 * @param {string|number} toId
 * @returns {boolean}
 */
export function hasConnectionBetween(connections, fromId, toId) {
  const key = getPairKey(fromId, toId);
  return connections.some((c) => getPairKey(c.from, c.to) === key);
}

/**
 * Alterna conexión existente o crea una nueva entre dos componentes.
 * Regla: solo una conexión por par (A,B), pero cada componente puede conectar con muchos distintos.
 * @param {Connection[]} connections
 * @param {string|number|null} connectSource
 * @param {string|number} targetId
 * @returns {{ connections: Connection[], connectSource: string|number|null, created: boolean, removed: boolean, message?: string }}
 */
export function handleConnectClick(connections, connectSource, targetId) {
  if (!connectSource) {
    return { connections, connectSource: targetId, created: false, removed: false };
  }

  if (connectSource === targetId) {
    return { connections, connectSource: null, created: false, removed: false };
  }

  if (hasConnectionBetween(connections, connectSource, targetId)) {
    const existing = connections.find(
      (c) => c.from === connectSource && c.to === targetId
    );
    if (existing) {
      const next = connections.filter((c) => c.id !== existing.id);
      return {
        connections: next,
        connectSource: null,
        created: false,
        removed: true,
      };
    }
    return {
      connections,
      connectSource: null,
      created: false,
      removed: false,
      message: 'Ya existe una conexión entre estos componentes',
    };
  }

  return {
    connections: [...connections, createConnection(connectSource, targetId)],
    connectSource: null,
    created: true,
    removed: false,
  };
}
