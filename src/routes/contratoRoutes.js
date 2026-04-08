const express = require('express');
const router = express.Router();
const contratoController = require('../controllers/contratoController');

// 🔹 Ruta para guardar el contrato (Llamando al controlador)
router.post('/', contratoController.crearContrato);

// 🔹 Ruta para ver el historial (Opcional)
router.get('/', contratoController.obtenerContratos);

module.exports = router;