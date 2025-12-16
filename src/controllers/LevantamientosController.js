const { Levantamiento } = require("../models");

exports.createLevantamiento = async (req, res) => {
  try {
    const levantamiento = await Levantamiento.create(req.body);
    res.status(201).json(levantamiento);
  } catch (err) {
    console.error("ERROR CREATE:", err);
    res.status(500).json({ error: "Error creando levantamiento" });
  }
};

exports.getLevantamientos = async (req, res) => {
  try {
    console.log("MODEL:", Levantamiento);
    const data = await Levantamiento.findAll();
    res.json(data);
  } catch (err) {
    console.error("ERROR GET LEVANTAMIENTOS:", err);
    res.status(500).json({ msg: "Error al obtener levantamientos" });
  }
};
