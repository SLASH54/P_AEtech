const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/cuentaController');
const { protect } = require('../middleware/authMiddleware');
const pdfController = require('../controllers/PdfCuentasController'); // Asegúrate que el nombre coincida

// POST /api/cuentas -> Crear
router.post('/', protect, cuentaController.crearCuenta);

// GET /api/cuentas -> Listar
router.get('/', protect, cuentaController.obtenerCuentas);

//pdf
router.get('/:id/pdf', protect, pdfController.generarPDFCuenta);

// ... tus otras rutas
router.delete('/:id', protect, cuentaController.eliminarCuenta);

module.exports = router;