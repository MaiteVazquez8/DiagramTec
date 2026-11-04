const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const phpAuthController = require('../controllers/phpAuthController');
const phpPagesController = require('../controllers/phpPagesController');

const router = express.Router();

/**
 * Rutas que replican los endpoints de los scripts PHP de la carpeta php/,
 * montadas en /php y /php-auth (los mismos prefijos que tenía el proxy).
 * Aceptan la ruta con y sin extensión .php, como hacía el proxy.
 */

function isJsonPost(req) {
  return (
    req.method === 'POST' &&
    String(req.headers['content-type'] || '').toLowerCase().includes('application/json')
  );
}

/**
 * En PHP la rama JSON solo se activaba con POST + Content-Type JSON;
 * cualquier otra petición caía en la rama de formulario.
 * next('route') salta al siguiente route (la rama de formulario/GET).
 */
function jsonOnly(req, res, next) {
  if (isJsonPost(req)) return next();
  next('route');
}

// login.php
router.post(['/login', '/login.php'], jsonOnly, asyncHandler(phpAuthController.loginJson));
router.get(['/login', '/login.php'], phpPagesController.loginPage);
router.post(['/login', '/login.php'], asyncHandler(phpPagesController.loginPagePost));

// registro.php
router.post(['/registro', '/registro.php'], jsonOnly, asyncHandler(phpAuthController.registerJson));
router.get(['/registro', '/registro.php'], phpPagesController.registerPage);
router.post(['/registro', '/registro.php'], asyncHandler(phpPagesController.registerPagePost));

// token.php
router.post(['/token', '/token.php'], jsonOnly, asyncHandler(phpAuthController.requestRecoveryCode));
router.get(['/token', '/token.php'], phpPagesController.tokenPage);
router.post(['/token', '/token.php'], asyncHandler(phpPagesController.tokenPagePost));

// modificarClave.php
router.post(
  ['/modificarClave', '/modificarClave.php'],
  jsonOnly,
  asyncHandler(phpAuthController.resetPassword),
);
router.get(['/modificarClave', '/modificarClave.php'], phpPagesController.resetPasswordPage);
router.post(
  ['/modificarClave', '/modificarClave.php'],
  asyncHandler(phpPagesController.resetPasswordPagePost),
);

// google_auth.php (?action=login | ?action=callback)
router.all(['/google_auth', '/google_auth.php'], asyncHandler(phpAuthController.googleAuth));

module.exports = router;
