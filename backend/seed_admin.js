require('dotenv').config();
const bcrypt = require('bcryptjs');
const { openDb } = require('./db');

const firstName = 'Super';
const lastName = 'Admin';
const email = 'admin@diagramtec.com';
const password = 'admin123';
const role = 'superadmin';

const passwordHash = bcrypt.hashSync(password, 10);

async function seedAdmin() {
  let db;
  try {
    db = await openDb();
    const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, users[0].id]);
      console.log(`Usuario ${email} actualizado a superadmin.`);
    } else {
      await db.execute(
        'INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
        [firstName, lastName, email, passwordHash, role]
      );
      console.log(`Usuario superadmin creado: ${email} / ${password}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error al crear superadmin:', err);
    process.exit(1);
  } finally {
    if (db) await db.end();
  }
}

seedAdmin();
