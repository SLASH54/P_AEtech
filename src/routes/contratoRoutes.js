const express = require('express');
const router = express.Router();
const contratoController = require('../controllers/contratoController');

router.post('/', contratoController.crearContrato);
router.get('/', contratoController.obtenerContratos);

module.exports = router;