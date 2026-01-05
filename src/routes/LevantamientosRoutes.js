const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LevantamientosController');
const { protect } = require("../middleware/authMiddleware");

// Rutas Estándar
router.post("/", protect, ctrl.createLevantamiento);
router.get("/", protect, ctrl.getLevantamientos);
router.get("/:id", protect, ctrl.getLevantamientoById); 
router.put("/:id", protect, ctrl.updateLevantamiento);
router.delete("/:id", protect, ctrl.deleteLevantamiento);

// 📄 Ruta para el PDF - ¡Corregida!
// Usamos "ctrl" porque así lo definimos arriba
router.get('/pdf/:id', protect, ctrl.generateLevantamientoPDF);

module.exports = router;