const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/levantamientos.controller");

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);
router.delete("/:id", ctrl.deleteLevantamiento);
router.put("/:id", ctrl.updateLevantamiento);


module.exports = router;
