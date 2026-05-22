const designRepository = require('../repositories/designRepository');
const classRepository = require('../repositories/classRepository');

async function listDesigns(db, userId) {
  return await designRepository.findDesignsByOwner(db, userId);
}

async function getDesign(db, id, user) {
  const design = await designRepository.findDesignById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  if (design.ownerId !== user.id && user.role !== 'superadmin') {
    if (design.classId) {
      const memberRows = await classRepository.findMembersForClass(db, design.classId, user.id);
      if (memberRows.length === 0) throw new Error('UNAUTHORIZED');
    } else {
      throw new Error('UNAUTHORIZED');
    }
  }
  return design;
}

async function createDesign(db, userId, data) {
  if (!data.title || !data.content) throw new Error('TITLE_AND_CONTENT_REQUIRED');
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
  const design = await designRepository.findDesignById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  if (design.ownerId !== userId && userRole !== 'superadmin') throw new Error('UNAUTHORIZED');
  return await designRepository.updateDesign(db, id, data);
}

async function deleteDesign(db, id, userId, userRole) {
  const design = await designRepository.findDesignById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  if (design.ownerId !== userId && userRole !== 'superadmin') throw new Error('UNAUTHORIZED');
  await designRepository.deleteDesign(db, id);
}

async function copyDesign(db, id, userId) {
  const design = await designRepository.findDesignById(db, id);
  if (!design) throw new Error('DESIGN_NOT_FOUND');
  return await designRepository.copyDesign(db, id, userId);
}

module.exports = {
  listDesigns,
  getDesign,
  createDesign,
  updateDesign,
  deleteDesign,
  copyDesign
};