const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/LevantamientosController");

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);

// 💡 ESTA ES LA RUTA QUE TE FALTA PARA QUE EL BOTÓN "VER" FUNCIONE
router.get("/:id", ctrl.getOne); 

router.delete("/:id", ctrl.deleteLevantamiento);
router.put("/:id", ctrl.updateLevantamiento);

module.exports = router;