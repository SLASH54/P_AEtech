const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/LevantamientosController');
const pdfLevController = require("../controllers/PdfLevantamientosController");


router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);
router.get("/:id", ctrl.getLevantamientoById); // 👈 Esta debe existir para que "Ver" funcione
router.put("/:id", ctrl.updateLevantamiento);
router.delete("/:id", ctrl.deleteLevantamiento);

// Ruta para descargar el PDF
router.get("/:id/pdf", pdfLevController.generateLevantamientoPDF);



module.exports = router;