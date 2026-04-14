const express = require('express');
const router = express.Router();

// 1. Importamos los controladores
// Asegúrate de que los nombres de los archivos en tu carpeta 'controllers' sean EXACTAMENTE estos
const contratoController = require('../controllers/contratoController');
const pdfContratoController = require('../controllers/PdfContratoController'); 

// --- RUTAS ---

// 🔹 Guardar contrato con dos firmas (POST)
// Esta ruta recibe el JSON con clienteNombre, clienteRFC, contratoFirmaBase64 y firmaPrestadoraBase64
router.post('/', contratoController.crearContrato);

// 🔹 Ver historial de contratos (GET)
// Sirve para listar los contratos guardados en la base de datos de Neon
router.get('/', contratoController.obtenerContratos);

// 🔹 Generar y Descargar el PDF (GET)
// Esta es la ruta que abre el PDF en una pestaña nueva con el ID que genera Render
router.get('/descargar/:id', pdfContratoController.generarPDFContrato);

module.exports = router;