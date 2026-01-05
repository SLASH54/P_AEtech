const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LevantamientosController');

const levantamientoController = require("../controllers/LevantamientosController"); 
const { protect } = require("../middleware/authMiddleware");

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);
router.get("/:id", ctrl.getLevantamientoById); // 👈 Esta debe existir para que "Ver" funcione
router.put("/:id", ctrl.updateLevantamiento);
router.delete("/:id", ctrl.deleteLevantamiento);

router.get('/pdf/:id', protect, levantamientoController.generateLevantamientoPDF);
module.exports = router;