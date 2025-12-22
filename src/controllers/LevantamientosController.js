const db = require("../models");
const Levantamiento = db.Levantamiento;

// GET ALL
exports.getLevantamientos = async (req, res) => {
  try {
    const data = await Levantamiento.findAll({
      order: [["createdAt", "DESC"]]
    });
    res.json(data);
  } catch (err) {
    console.error("ERROR GET LEVANTAMIENTOS:", err);
    res.status(500).json({ error: "Error obteniendo levantamientos" });
  }
};

// GET ONE
exports.getLevantamientoById = async (req, res) => {
  try {
    const data = await Levantamiento.findByPk(req.params.id);
    if (!data) return res.status(404).json({ msg: "No encontrado" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
};

// CREATE
exports.createLevantamiento = async (req, res) => {
  try {
    const nuevo = await Levantamiento.create(req.body);
    res.json(nuevo);
  } catch (err) {
    console.error("ERROR CREATE:", err);
    res.status(500).json({ error: "Error creando levantamiento" });
  }
};

// UPDATE
exports.updateLevantamiento = async (req, res) => {
  try {
    await Levantamiento.update(req.body, {
      where: { id: req.params.id }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error actualizando" });
  }
};

// DELETE
exports.deleteLevantamiento = async (req, res) => {
  try {
    await Levantamiento.destroy({
      where: { id: req.params.id }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando" });
  }
};
