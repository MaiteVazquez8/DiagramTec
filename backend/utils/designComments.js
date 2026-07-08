/** Comentarios de publicación sin columna designId: se codifica en content. */
const DESIGN_COMMENT_PREFIX = /^__designId=(\d+)__\n/;

function encodeDesignComment(designId, content) {
  return `__designId=${Number(designId)}__\n${content}`;
}

function decodeDesignComment(row) {
  if (!row || typeof row.content !== 'string') return row;

  const match = row.content.match(DESIGN_COMMENT_PREFIX);
  if (!match) {
    return { ...row, designId: row.designId ?? null };
  }

  return {
    ...row,
    designId: Number(match[1]),
    content: row.content.slice(match[0].length),
  };
}

function mapDesignComments(rows) {
  return rows.map(decodeDesignComment);
}

module.exports = {
  encodeDesignComment,
  decodeDesignComment,
  mapDesignComments,
};
