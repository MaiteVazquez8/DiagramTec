/**
 * Conexiones entre formas (clic origen → clic destino) y utilidades de gestión.
 * @typedef {Object} Connection
 * @property {string|number} id
 * @property {string|number} from  // ID de la figura origen
 * @property {string|number} to    // ID de la figura destino
 */

/**
 * Normaliza un ID de extremo: convierte a número si es numérico, sino mantiene string.
 * Evita inconsistencias string "1" vs number 1 al comparar conexiones.
 * @param {string|number} id
 * @returns {string|number}
 */
export function normalizeEndpointId(id) {
  const n = Number(id);
  return Number.isNaN(n) ? id : n;
}

/**
 * Normaliza una conexión completa aplicando normalizeEndpointId a from y to.
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

/**
 * Crea una nueva conexión dirigida entre dos figuras.
 * @param {string|number} fromId
 * @param {string|number} toId
 * @param {string|number} [id]
 * @returns {Connection}
 */
export function createConnection(fromId, toId, id) {
  return {
    id: id ?? Date.now(),
    from: normalizeEndpointId(fromId),
    to: normalizeEndpointId(toId),
  };
}

/**
 * Elimina todas las conexiones que involucran a una figura (como origen o destino).
 * @param {Connection[]} connections
 * @param {string|number} shapeId
 * @returns {Connection[]}
 */
export function removeConnectionsForShape(connections, shapeId) {
  return connections.filter((c) => c.from !== shapeId && c.to !== shapeId);
}

/**
 * Elimina una conexión específica por su ID.
 * @param {Connection[]} connections
 * @param {string|number} connectionId
 * @returns {Connection[]}
 */
export function removeConnection(connections, connectionId) {
  return connections.filter((c) => c.id !== connectionId);
}

/**
 * Genera clave única para un par de componentes sin importar la dirección (A→B = B→A).
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
 * Comprueba si ya existe una conexión entre dos figuras (en cualquier dirección).
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
 * Gestiona el flujo de clic para conectar figuras:
 * 1. Primer clic: selecciona origen (connectSource).
 * 2. Segundo clic en otra figura: crea conexión o la elimina si ya existe en esa dirección.
 * Regla: solo una conexión por par (A,B), pero cada figura puede conectar con muchas distintas.
 * @param {Connection[]} connections
 * @param {string|number|null} connectSource  // Figura origen seleccionada, o null
 * @param {string|number} targetId            // Figura sobre la que se hizo clic
 * @returns {{ connections: Connection[], connectSource: string|number|null, created: boolean, removed: boolean, message?: string }}
 */
export function handleConnectClick(connections, connectSource, targetId) {
  // Primer clic: guardar figura origen
  if (!connectSource) {
    return { connections, connectSource: targetId, created: false, removed: false };
  }

  // Clic en la misma figura: cancelar selección
  if (connectSource === targetId) {
    return { connections, connectSource: null, created: false, removed: false };
  }

  // Ya existe conexión entre el par: intentar eliminar si coincide la dirección
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
    // Existe en dirección opuesta: no permitir segunda conexión
    return {
      connections,
      connectSource: null,
      created: false,
      removed: false,
      message: 'Ya existe una conexión entre estos componentes',
    };
  }

  // Crear nueva conexión origen → destino
  return {
    connections: [...connections, createConnection(connectSource, targetId)],
    connectSource: null,
    created: true,
    removed: false,
  };
}
