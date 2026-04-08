const express = require('express');
const router = express.Router();
const contratoController = require('../controllers/contratoController'); // ✅ Nombre diferente

router.post('/', contratoController.crearContrato);
module.exports = router;