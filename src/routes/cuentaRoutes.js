const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/cuentaController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/cuentas -> Crear
router.post('/', protect, cuentaController.crearCuenta);

// GET /api/cuentas -> Listar
router.get('/', protect, cuentaController.obtenerCuentas);

module.exports = router;