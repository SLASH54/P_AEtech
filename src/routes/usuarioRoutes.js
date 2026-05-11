const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta para solicitar recuperación de contraseña
router.post('/forgot-password', usuarioController.forgotPassword);

module.exports = router;