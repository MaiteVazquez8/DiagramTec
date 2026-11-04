const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sessionService = require('../services/sessionService');
const mailService = require('../services/mailService');
const recoveryService = require('../services/recoveryService');
const {
  findByEmailAsIs,
  createUserAsIs,
  deleteUser,
} = require('../repositories/userRepository');
const { isValidEmail, isEmpty, isValidMailDomain } = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Formularios HTML de php/login.php, php/registro.php, php/token.php y
 * php/modificarClave.php (las ramas de servidor-render de esos scripts).
 */

function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body || {}, key);
}

function str(value) {
  return typeof value === 'string' ? value : '';
}

function sendHtml(res, html) {
  res.status(200).type('html').send(html);
}

// ---------------------------------------------------------------------------
// login.php
// ---------------------------------------------------------------------------

function loginPageHtml(message) {
  return `<!DOCTYPE html>
<html lang="es">
<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Iniciar sesión</title>

</head>

<body>

    <form action="" method="POST">

        <h1>Iniciar sesión</h1>

        <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            required
        >

        <br><br>

        <input
            type="password"
            name="password"
            placeholder="Contraseña"
            required
        >

        <br><br>

        <button type="submit" name="login">
            Iniciar sesión
        </button>

        <br><br>

        <a href="registro.php">
            Crear cuenta
        </a>

        <br>

        <a href="recuperarClave.php">
            Recuperar contraseña
        </a>

        <br><br>

        <p>
            ${message}
        </p>

    </form>

</body>
</html>`;
}

function loginPage(req, res) {
  sessionService.start(req, res);
  sendHtml(res, loginPageHtml(''));
}

async function loginPagePost(req, res) {
  const db = req.app.locals.db;
  sessionService.start(req, res);
  const session = req.session;
  const body = req.body || {};
  let message = '';

  if (has(body, 'login')) {
    const email = str(body.email).trim();
    const password = str(body.password);

    const user = await findByEmailAsIs(db, email);

    if (user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });

      session.jwt = token;
      session.user_id = user.id;
      session.role = user.role;

      await mailService.enviarMail(
        user.email,
        'Nuevo inicio de sesión',
        '<h2>Inicio de sesión detectado</h2><p>Tu cuenta inició sesión correctamente.</p>',
      );

      // En PHP: header("Location: dashboard.php")
      return res.redirect(`${req.baseUrl}/dashboard.php`);
    }

    message = 'Credenciales inválidas';
  }

  sendHtml(res, loginPageHtml(message));
}

// ---------------------------------------------------------------------------
// registro.php
// ---------------------------------------------------------------------------

function registerPageHtml(message) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro</title>
</head>
<body>

<form method="POST">

    <h1>Crear cuenta</h1>

    <input
        type="text"
        name="firstName"
        placeholder="Nombre"
        required
    >

    <br><br>

    <input
        type="text"
        name="lastName"
        placeholder="Apellido"
        required
    >

    <br><br>

    <input
        type="email"
        name="email"
        placeholder="Correo"
        required
    >

    <br><br>

    <input
        type="password"
        name="password"
        placeholder="Contraseña"
        required
    >

    <br><br>

    <input
        type="password"
        name="password2"
        placeholder="Confirmar contraseña"
        required
    >

    <br><br>

    <button type="submit" name="CrearUsuario">
        Registrarse
    </button>

    <br><br>

    ${message}

</form>

</body>
</html>`;
}

function registerPage(req, res) {
  sendHtml(res, registerPageHtml(''));
}

async function registerPagePost(req, res) {
  const db = req.app.locals.db;
  const body = req.body || {};
  let message = '';

  if (has(body, 'CrearUsuario')) {
    const firstName = str(body.firstName).trim();
    const lastName = str(body.lastName).trim();
    const email = str(body.email).trim();
    const password = str(body.password);
    const password2 = str(body.password2);

    if (isEmpty(firstName) || isEmpty(lastName) || isEmpty(email) || isEmpty(password) || isEmpty(password2)) {
      message = 'Todos los campos son obligatorios';
    } else if (!isValidEmail(email)) {
      message = 'Ingrese un correo válido';
    } else {
      const domain = email.slice(email.lastIndexOf('@') + 1);
      const domainOk = await isValidMailDomain(domain);

      if (!domainOk) {
        message = 'Ingrese un correo con un dominio válido';
      } else if (password !== password2) {
        message = 'Las contraseñas no coinciden';
      } else {
        const existing = await findByEmailAsIs(db, email);

        if (existing) {
          message = 'El correo ya existe';
        } else {
          try {
            const hash = await bcrypt.hash(password, 10);
            const insertId = await createUserAsIs(db, firstName, lastName, email, hash, 'student');

            const mailSent = await mailService.enviarMail(
              email,
              'Confirmación de registro',
              '<h2>Bienvenido a DiagramTec</h2><p>Gracias por registrarte con este correo.</p>',
            );

            if (mailSent) {
              message = 'Usuario creado correctamente';
            } else {
              // En PHP: si falla el mail se elimina el usuario recién creado.
              await deleteUser(db, insertId);
              message = 'No se pudo enviar el correo. Usa un correo real.';
            }
          } catch (err) {
            console.error('[REGISTER_FORM]', err.message || err);
            message = 'Error al crear usuario';
          }
        }
      }
    }
  }

  sendHtml(res, registerPageHtml(message));
}

// ---------------------------------------------------------------------------
// token.php
// ---------------------------------------------------------------------------

function tokenPageHtml(message) {
  return `<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Recuperar contraseña</title>

</head>

<body>

    <form action="" method="POST">

        <h1>Recuperar contraseña</h1>

        <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            required
        >

        <br><br>

        <button
            type="submit"
            name="enviarToken"
        >
            Enviar código
        </button>

        <br><br>

        <a href="login.php">
            Volver al login
        </a>

        <br><br>

        <p>
            ${message}
        </p>

    </form>

</body>

</html>`;
}

function tokenPage(req, res) {
  sendHtml(res, tokenPageHtml(''));
}

async function tokenPagePost(req, res) {
  const db = req.app.locals.db;
  const body = req.body || {};
  let message = '';

  if (has(body, 'enviarToken')) {
    const email = str(body.email).trim();

    if (!isValidEmail(email)) {
      message = 'Ingrese un correo válido';
    } else {
      const outcome = await recoveryService.requestRecoveryCodeForm(db, email);
      message = outcome.message;
    }
  }

  sendHtml(res, tokenPageHtml(message));
}

// ---------------------------------------------------------------------------
// modificarClave.php
// ---------------------------------------------------------------------------

function resetPasswordPageHtml(message) {
  return `<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Cambiar contraseña</title>

</head>

<body>

    <form action="" method="POST">

        <h1>Cambiar contraseña</h1>

        <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            required
        >

        <br><br>

        <input
            type="text"
            name="token"
            placeholder="Token"
            required
        >

        <br><br>

        <input
            type="password"
            name="password"
            placeholder="Nueva contraseña"
            required
        >

        <br><br>

        <input
            type="password"
            name="password2"
            placeholder="Confirmar contraseña"
            required
        >

        <br><br>

        <button
            type="submit"
            name="cambiar"
        >
            Cambiar contraseña
        </button>

        <br><br>

        <a href="login.php">
            Volver al login
        </a>

        <br><br>

        <p>
            ${message}
        </p>

    </form>

</body>

</html>`;
}

function resetPasswordPage(req, res) {
  sendHtml(res, resetPasswordPageHtml(''));
}

async function resetPasswordPagePost(req, res) {
  const db = req.app.locals.db;
  const body = req.body || {};
  let message = '';

  if (has(body, 'cambiar')) {
    const email = str(body.email).trim();
    const token = str(body.token).trim();
    const password = str(body.password);
    const password2 = str(body.password2);

    if (isEmpty(email) || isEmpty(token) || isEmpty(password) || isEmpty(password2)) {
      message = 'Complete todos los campos';
    } else if (password !== password2) {
      message = 'Las contraseñas no coinciden';
    } else {
      const outcome = await recoveryService.resetPasswordWithCode(db, email, token, password);
      message = outcome.ok ? outcome.message : outcome.error;
    }
  }

  sendHtml(res, resetPasswordPageHtml(message));
}

module.exports = {
  loginPage,
  loginPagePost,
  registerPage,
  registerPagePost,
  tokenPage,
  tokenPagePost,
  resetPasswordPage,
  resetPasswordPagePost,
};
