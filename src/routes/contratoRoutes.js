const express = require('express');
const router = express.Router();
const contratoController = require('../controllers/contratoController'); // ✅ Nombre diferente

const pdfContratoController = require('../controllers/PdfContratoController');

// ... tus otras rutas
router.get('/descargar/:id', pdfContratoController.generarPDFContrato);

// En contratoRoutes.js


router.post('/', contratoController.crearContrato);
module.exports = router;