const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/LevantamientosController");

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);
router.put("/:id", ctrl.updateLevantamiento);
router.delete("/:id", ctrl.deleteLevantamiento);
router.get("/:id", ctrl.getLevantamientoById);


module.exports = router;
