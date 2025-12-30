const express = require('express');
const router = express.Router();
const levantamientosController = require('../controllers/LevantamientosController');

router.get('/', levantamientosController.getAllLevantamientos);
router.post('/', levantamientosController.createLevantamiento);

// 💡 ESTA ES LA LÍNEA QUE FALTA:
router.get('/:id', levantamientosController.getLevantamientoById); 

module.exports = router;