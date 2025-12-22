const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/LevantamientosController");

router.get("/", ctrl.getLevantamientos);
router.get("/:id", ctrl.getLevantamientoById);
router.post("/", ctrl.createLevantamiento);
router.put("/:id", ctrl.updateLevantamiento);
router.delete("/:id", ctrl.deleteLevantamiento);

module.exports = router;
