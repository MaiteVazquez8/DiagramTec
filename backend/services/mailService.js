const nodemailer = require('nodemailer');

/**
 * Equivalente a php/mail.php → enviarMail($destino, $asunto, $mensaje).
 * SMTP de Gmail (mismo host/puerto/TLS que PHPMailer en PHP).
 * Credenciales desde variables de entorno (EMAIL_USER / EMAIL_PASS).
 */

let transport = null;

function getTransport() {
  if (transport) return transport;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  return transport;
}

async function enviarMail(destino, asunto, mensaje) {
  try {
    const smtp = getTransport();
    if (!smtp) return false;

    await smtp.sendMail({
      from: `"DiagramTec" <${process.env.EMAIL_USER}>`,
      to: destino,
      subject: asunto,
      html: mensaje,
    });

    return true;
  } catch (err) {
    console.error('[MAIL]', err.message || err);
    return false;
  }
}

module.exports = { enviarMail };
