const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LevantamientosController');
// 💡 IMPORTANTE: Traemos el middleware de protección
const { protect } = require('../middleware/authMiddleware'); 

router.post("/", protect, ctrl.createLevantamiento);
router.get("/", protect, ctrl.getLevantamientos);
router.get("/:id", protect, ctrl.getLevantamientoById); 
router.put("/:id", protect, ctrl.updateLevantamiento);
router.delete("/:id", protect, ctrl.deleteLevantamiento);

// 📄 RUTA DEL PDF CORREGIDA (usando 'ctrl' que definiste arriba)
router.get('/pdf/:id', protect, ctrl.generateLevantamientoPDF); 

module.exports = router;