const express = require('express');
const router = express.Router();

// Importamos los dos controladores
const pdfContratoController = require('../controllers/PdfContratoController'); // <--- Revisa la "P" o "p"

// 🔹 Ruta para Guardar el contrato (POST)
router.post('/', contratoController.crearContrato);

// 🔹 Ruta para Descargar el PDF (GET)
router.get('/descargar/:id', pdfContratoController.generarPDFContrato);

// 🔹 Ruta para ver el historial (Opcional, si la usas)
router.get('/', contratoController.obtenerContratos);

module.exports = router;