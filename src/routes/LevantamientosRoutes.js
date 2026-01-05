const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LevantamientosController');

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);
router.get("/:id", ctrl.getLevantamientoById); // 👈 Esta debe existir para que "Ver" funcione
router.put("/:id", ctrl.updateLevantamiento);
router.delete("/:id", ctrl.deleteLevantamiento);

module.exports = router;