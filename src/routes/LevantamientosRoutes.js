const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/LevantamientosController");

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);
router.get("/:id", ctrl.getLevantamientoById);
router.delete("/:id", ctrl.deleteLevantamiento);

module.exports = router;
