const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass },
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
    console.error('[mail] Error al enviar:', err.message);
    return false;
  }
}

module.exports = { sendMail };
