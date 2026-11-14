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

async function getDesignPdf(db, id, user) {
  const design = await designRepository.findDesignAccessById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  await assertCanView(db, design, user);
  return await designRepository.findDesignPdfById(db, id);
}

async function createDesign(db, userId, data) {
  if (!data.title || !data.content) throw new Error('TITLE_AND_CONTENT_REQUIRED');
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

  if (data.classId !== undefined && data.classId !== null) {
    const classRow = await classRepository.findClassById(db, data.classId);
    if (!classRow) throw new Error('CLASS_NOT_FOUND');
    const isOwner = Number(classRow.ownerId) === Number(userId);
    const members = await classRepository.findMembersForClass(db, data.classId, userId);
    const canPublish =
      userRole === 'superadmin'
      || (userRole === 'teacher' && (isOwner || members.length > 0));
    if (!canPublish) throw new Error('UNAUTHORIZED');
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

async function copyDesign(db, id, userId) {
  const design = await designRepository.findDesignAccessById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
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