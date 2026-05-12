const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta para solicitar recuperación de contraseña
router.post('/forgot-password', usuarioController.forgotPassword);


// Ruta para restablecer la contraseña físicamente
router.post('/reset-password', usuarioController.resetPassword);


// Ruta para restablecer rápido sin correo
router.post('/quick-reset', usuarioController.quickReset);

module.exports = router;