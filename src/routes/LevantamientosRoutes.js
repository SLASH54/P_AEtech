const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LevantamientosController');
const { protect } = require('../middleware/authMiddleware'); // 👈 CORRECCIÓN 1: Importar protect

router.post("/", protect, ctrl.createLevantamiento);
router.get("/", protect, ctrl.getLevantamientos);
router.get("/:id", protect, ctrl.getLevantamientoById); 
router.put("/:id", protect, ctrl.updateLevantamiento);
router.delete("/:id", protect, ctrl.deleteLevantamiento);

// 📄 RUTA DEL PDF CORREGIDA
// 👈 CORRECCIÓN 2: Usar 'ctrl' en lugar de 'levantamientoController'
router.get('/pdf/:id', protect, ctrl.generateLevantamientoPDF); 

module.exports = router;