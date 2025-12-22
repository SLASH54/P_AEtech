const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/LevantamientosController");

router.post("/", ctrl.createLevantamiento);
router.get("/", ctrl.getLevantamientos);
router.delete("/:id", ctrl.deleteLevantamiento);
router.put("/:id", ctrl.updateLevantamiento);


const upload = require("../middlewares/upload");

router.post(
  "/",
  upload.array("imagenes"),
  ctrl.createLevantamiento
);



module.exports = router;
