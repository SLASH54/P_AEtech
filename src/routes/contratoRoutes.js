const express = require('express');
const router = express.Router();

// 1. Importamos AMBOS controladores (Ojo con las mayúsculas/minúsculas)
const contratoController = require('../controllers/contratoController');
const pdfContratoController = require('../controllers/PdfContratoController'); 

// 🔹 Guardar contrato (POST) -> Usa contratoController
router.post('/', contratoController.crearContrato);

// 🔹 Ver historial (GET) -> Usa contratoController
router.get('/', contratoController.obtenerContratos);

// 🔹 Descargar PDF (GET) -> Usa pdfContratoController
router.get('/descargar/:id', pdfContratoController.generarPDFContrato);

module.exports = router;