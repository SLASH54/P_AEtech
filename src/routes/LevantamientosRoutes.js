const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/LevantamientosController");

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);

module.exports = router;
