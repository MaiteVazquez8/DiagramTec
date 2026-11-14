const designRepository = require('../repositories/designRepository');
const classRepository = require('../repositories/classRepository');

const MAX_DESIGNS_PER_USER = 20;

async function listDesigns(db, userId) {
  return await designRepository.findDesignsByOwner(db, userId);
}

/** Lanza error si el usuario no puede ver el diseño (dueño, superadmin o miembro de su clase). */
async function assertCanView(db, design, user) {
  if (Number(design.ownerId) === Number(user.id) || user.role === 'superadmin') return;
  if (design.classId) {
    const memberRows = await classRepository.findMembersForClass(db, design.classId, user.id);
    if (memberRows.length > 0) return;
  }
  throw new Error('UNAUTHORIZED');
}

async function getDesign(db, id, user) {
  const design = await designRepository.findDesignById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  await assertCanView(db, design, user);
  return design;
}

/** Solo el PDF, con los mismos permisos que getDesign (sin leer contenido ni imagen). */
async function getDesignPdf(db, id, user) {
  const design = await designRepository.findDesignAccessById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  await assertCanView(db, design, user);
  return await designRepository.findDesignPdfById(db, id);
}

// Solo data URLs de imagen/PDF: un "javascript:..." en pdf_data se ejecutaría al descargarlo.
const IMAGE_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const PDF_RE = /^data:application\/pdf;(?:[a-z-]+=[^;,]*;)*base64,[A-Za-z0-9+/=]+$/;

function validateDesignData(data, { isCreate }) {
  if (isCreate && (!data.title || !data.content)) throw new Error('TITLE_AND_CONTENT_REQUIRED');
  if (data.title != null && (typeof data.title !== 'string' || data.title.length > 255)) throw new Error('TITLE_AND_CONTENT_REQUIRED');
  if (data.description != null && (typeof data.description !== 'string' || data.description.length > 5000)) {
    throw new Error('TITLE_AND_CONTENT_REQUIRED');
  }
  if (data.image && (typeof data.image !== 'string' || !IMAGE_RE.test(data.image))) throw new Error('INVALID_FILE');
  if (data.pdf_data && (typeof data.pdf_data !== 'string' || !PDF_RE.test(data.pdf_data))) throw new Error('INVALID_FILE');
}

/** Publicar en una clase: superadmin, o profesor dueño/miembro de esa clase. */
async function assertCanPublish(db, classId, userId, userRole) {
  if (!classId) return;
  const classRow = await classRepository.findClassById(db, classId);
  if (!classRow) throw new Error('CLASS_NOT_FOUND');
  const isOwner = Number(classRow.ownerId) === Number(userId);
  const members = await classRepository.findMembersForClass(db, classId, userId);
  const canPublish = userRole === 'superadmin' || (userRole === 'teacher' && (isOwner || members.length > 0));
  if (!canPublish) throw new Error('UNAUTHORIZED');
}

async function createDesign(db, user, data) {
  validateDesignData(data, { isCreate: true });
  const userId = user.id;
  data = { ...data, classId: data.classId || null };
  await assertCanPublish(db, data.classId, userId, user.role);
  const count = await designRepository.countDesignsByOwner(db, userId);
  if (count >= MAX_DESIGNS_PER_USER) {
    const err = new Error('MAX_DESIGNS_REACHED');
    err.statusCode = 403;
    throw err;
  }
  const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
  return await designRepository.createDesign(db, {
    title: data.title,
    ownerId: userId,
    classId: data.classId,
    content,
    image: data.image,
    pdf_data: data.pdf_data,
    description: data.description
  });
}

async function updateDesign(db, id, userId, userRole, data) {
  const design = await designRepository.findDesignAccessById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  if (Number(design.ownerId) !== Number(userId) && userRole !== 'superadmin') {
    throw new Error('UNAUTHORIZED');
  }

  validateDesignData(data, { isCreate: false });
  if (data.classId !== undefined) {
    data = { ...data, classId: data.classId || null };
    await assertCanPublish(db, data.classId, userId, userRole);
  }

  return await designRepository.updateDesign(db, id, data);
}

async function deleteDesign(db, id, userId, userRole) {
  const design = await designRepository.findDesignAccessById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  if (Number(design.ownerId) !== Number(userId) && userRole !== 'superadmin') {
    throw new Error('UNAUTHORIZED');
  }
  await designRepository.deleteDesign(db, id);
}

async function copyDesign(db, id, user) {
  // Misma regla que para verlo: dueño, miembro de su clase o superadmin.
  const design = await designRepository.findDesignAccessById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  await assertCanView(db, design, user);
  const userId = user.id;
  const count = await designRepository.countDesignsByOwner(db, userId);
  if (count >= MAX_DESIGNS_PER_USER) {
    const err = new Error('MAX_DESIGNS_REACHED');
    err.statusCode = 403;
    throw err;
  }
  return await designRepository.copyDesign(db, id, userId);
}

module.exports = {
  listDesigns,
  getDesign,
  getDesignPdf,
  createDesign,
  updateDesign,
  deleteDesign,
  copyDesign
};