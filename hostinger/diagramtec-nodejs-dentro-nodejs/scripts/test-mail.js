/**
 * Verifica la conexión SMTP con las variables EMAIL_* del .env.
 * Uso: node scripts/test-mail.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { getTransporter } = require('../services/mailService');

async function main() {
  const user = process.env.EMAIL_USER;
  if (!user || !process.env.EMAIL_PASS) {
    console.error('Faltan EMAIL_USER o EMAIL_PASS en .env');
    process.exit(1);
  }

  const mailer = getTransporter();
  if (!mailer) {
    console.error('No se pudo crear el transporte SMTP');
    process.exit(1);
  }

  try {
    await mailer.verify();
    console.log(`SMTP OK (${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${process.env.EMAIL_PORT || 587})`);
    process.exit(0);
  } catch (err) {
    console.error('SMTP FAIL:', err.message);
    if (String(err.message).includes('BadCredentials')) {
      console.error('Generá una contraseña de aplicación en https://myaccount.google.com/apppasswords');
    }
    process.exit(1);
  }
}

main();
