// Crea o asciende un superadmin. Uso:
//   ADMIN_EMAIL=vos@dominio.com ADMIN_PASSWORD='Una-Clave-Fuerte-123' node seed_admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { openDb } = require('./db');
const { isStrongPassword } = require('./services/authService');

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';

async function seedAdmin() {
  if (!email || !isStrongPassword(password)) {
    console.error('Definí ADMIN_EMAIL y ADMIN_PASSWORD (8+ caracteres, mayúscula, minúscula, número y símbolo).');
    process.exit(1);
  }

  let db;
  try {
    db = await openDb();
    const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      await db.execute('UPDATE users SET role = ?, email_verified_at = COALESCE(email_verified_at, now()) WHERE id = ?', ['superadmin', users[0].id]);
      console.log(`Usuario ${email} ascendido a superadmin (su contraseña no cambió).`);
    } else {
      await db.execute(
        'INSERT INTO users (firstName, lastName, email, passwordHash, role, email_verified_at) VALUES (?, ?, ?, ?, ?, now())',
        ['Super', 'Admin', email, await bcrypt.hash(password, 10), 'superadmin'],
      );
      console.log(`Superadmin creado: ${email}`);
    }
  } catch (err) {
    console.error('Error al crear superadmin:', err.message);
    process.exitCode = 1;
  } finally {
    if (db) await db.end();
  }
}

seedAdmin();
