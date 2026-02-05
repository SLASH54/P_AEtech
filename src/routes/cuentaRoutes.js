const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/cuentaController');
const { protect } = require('../middleware/authMiddleware');
const pdfController = require('../controllers/PdfCuentasController'); // Asegúrate que el nombre coincida

// NUEVA RUTA PÚBLICA (Agrégala antes de las que tienen 'protect')
// Esta ruta no lleva el middleware "protect"
router.get('/publica/:id', cuentaController.obtenerCuentaPorIdPublica); 

// 📄 NUEVA RUTA PARA DESCARGA PÚBLICA DE PDF (Sin 'protect')
router.get('/publica/:id/pdf', pdfController.generarPDFCuenta);

// POST /api/cuentas -> Crear
router.post('/', protect, cuentaController.crearCuenta);

// GET /api/cuentas -> Listar
router.get('/', protect, cuentaController.obtenerCuentas);

//pdf
router.get('/:id/pdf', protect, pdfController.generarPDFCuenta);

// ... tus otras rutas
router.delete('/:id', protect, cuentaController.eliminarCuenta);

router.put('/:id', protect, cuentaController.editarCuenta);

router.put('/liquidar/:id', cuentaController.liquidarCuenta);

module.exports = router;