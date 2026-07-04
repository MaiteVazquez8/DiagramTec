const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  const secure = process.env.EMAIL_SECURE === 'true';
  const port = Number(process.env.EMAIL_PORT || (secure ? 465 : 587));

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: { user, pass },
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  });

  return transporter;
}

async function sendMail(to, subject, html) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[mail] EMAIL_USER / EMAIL_PASS no configurados; no se envió el correo.');
    return false;
  }

  try {
    await mailer.sendMail({
      from: `"DiagramTec" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    const code = err.responseCode || err.code || 'unknown';
    console.error(`[mail] Error al enviar (${code}):`, err.message);
    if (code === 535 || String(err.message).includes('BadCredentials')) {
      console.error('[mail] Gmail rechazó las credenciales. Generá una contraseña de aplicación nueva en https://myaccount.google.com/apppasswords');
    }
    return false;
  }
}

module.exports = { sendMail, getTransporter };
