const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/LevantamientosController");

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);
router.delete("/:id", ctrl.deleteLevantamiento);
router.put("/:id", ctrl.updateLevantamiento);

// Debe ir debajo de la ruta POST
router.get('/:id', levantamientosController.getLevantamientoById);


module.exports = router;
