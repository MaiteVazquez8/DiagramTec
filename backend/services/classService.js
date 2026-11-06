const classRepository = require('../repositories/classRepository');
const { generateClassCode } = require('../db');

async function listClasses(db, userId) {
  return await classRepository.findClassesForUser(db, userId);
}

async function listAvailableClasses(db, userId) {
  return await classRepository.findAvailableClasses(db, userId);
}

function validateClassText(title, description) {
  if (typeof title !== 'string' || !title.trim() || title.length > 255) throw new Error('TITLE_REQUIRED');
  if (description != null && (typeof description !== 'string' || description.length > 5000)) {
    throw new Error('TITLE_REQUIRED');
  }
}

async function createClass(db, userId, title, description) {
  validateClassText(title, description);
  let code;
  let attempts = 0;
  let existing;
  do {
    code = generateClassCode();
    attempts++;
    if (attempts > 10) throw new Error('CODE_GENERATION_FAILED');
    existing = await classRepository.findClassByCode(db, code);
  } while (existing);
  const classRow = await classRepository.createClass(db, title, description, code, userId);
  await classRepository.joinClass(db, classRow.id, userId);
  return classRow;
}

async function getClass(db, classId, userId) {
  const classRow = await classRepository.findClassById(db, classId);
  if (!classRow || userId == null) return classRow;
  const isOwner = Number(classRow.ownerId) === Number(userId);
  let members = await classRepository.findMembersForClass(db, classId, userId);
  if (isOwner && members.length === 0) {
    await classRepository.joinClass(db, classId, userId);
    members = [{ id: 1 }];
  }
  return {
    ...classRow,
    joined: isOwner || members.length > 0,
    isOwner,
  };
}

async function deleteClass(db, classId) {
  return await classRepository.deleteClass(db, classId);
}

async function updateClass(db, classId, requester, title, description) {
  validateClassText(title, description);

  const classRow = await classRepository.findClassById(db, classId);
  if (!classRow) throw new Error('CLASS_NOT_FOUND');

  const isOwner = Number(classRow.ownerId) === Number(requester.id);
  if (!isOwner && requester.role !== 'superadmin') {
    throw new Error('UNAUTHORIZED');
  }

  return await classRepository.updateClass(db, classId, title, description);
}

async function joinClass(db, code, userId) {
  const classRow = await classRepository.findClassByCode(db, code);
  if (!classRow) throw new Error('CLASS_NOT_FOUND');
  const existing = await classRepository.findMembersForClass(db, classRow.id, userId);
  if (existing.length > 0) return { joined: true, class: { id: classRow.id, title: classRow.title } };
  await classRepository.joinClass(db, classRow.id, userId);
  return { joined: true, class: { id: classRow.id, title: classRow.title } };
}

async function leaveClass(db, classId, userId) {
  await classRepository.leaveClass(db, classId, userId);
}

async function getClassComments(db, classId) {
  return await classRepository.findCommentsByClassId(db, classId);
}

async function addClassComment(db, classId, user, content) {
  const classRow = await classRepository.findClassById(db, classId);
  if (!classRow) throw new Error('CLASS_NOT_FOUND');
  const isOwner = Number(classRow.ownerId) === Number(user.id);
  const isMember = (await classRepository.findMembersForClass(db, classId, user.id)).length > 0;
  if (!isOwner && !isMember && user.role !== 'superadmin') throw new Error('UNAUTHORIZED');
  return await classRepository.insertClassComment(db, classId, user.id, content);
}

async function isUserInClass(db, classId, userId) {
  const rows = await classRepository.findMembersForClass(db, classId, userId);
  return rows.length > 0;
}

async function listDesignsByClass(db, classId) {
  return await classRepository.findDesignsByClass(db, classId);
}

async function listClassMembers(db, classId, requester) {
  const classRow = await classRepository.findClassById(db, classId);
  if (!classRow) throw new Error('CLASS_NOT_FOUND');

  const isOwner = Number(classRow.ownerId) === Number(requester.id);
  if (!isOwner && requester.role !== 'superadmin') {
    throw new Error('UNAUTHORIZED');
  }

  const members = await classRepository.findStudentMembersByClass(db, classId);
  return { class: classRow, members };
}

async function expelStudent(db, classId, targetUserId, requester) {
  const classRow = await classRepository.findClassById(db, classId);
  if (!classRow) throw new Error('CLASS_NOT_FOUND');

  const isOwner = Number(classRow.ownerId) === Number(requester.id);
  if (!isOwner && requester.role !== 'superadmin') {
    throw new Error('UNAUTHORIZED');
  }

  if (Number(targetUserId) === Number(classRow.ownerId)) {
    throw new Error('CANNOT_EXPEL_OWNER');
  }

  const targetUser = await classRepository.findUserRole(db, targetUserId);
  if (!targetUser) throw new Error('USER_NOT_FOUND');
  if (targetUser.role !== 'student') {
    throw new Error('CANNOT_EXPEL_NON_STUDENT');
  }

  await classRepository.expelMemberFromClass(db, classId, targetUserId);
  return { ok: true };
}

module.exports = {
  listClasses,
  listAvailableClasses,
  createClass,
  getClass,
  updateClass,
  deleteClass,
  joinClass,
  leaveClass,
  getClassComments,
  addClassComment,
  isUserInClass,
  listDesignsByClass,
  listClassMembers,
  expelStudent
};