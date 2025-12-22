const { Levantamiento } = require("../models");

// CREAR
exports.createLevantamiento = async (req, res) => {
  try {
    const levantamiento = await Levantamiento.create(req.body);
    res.status(201).json(levantamiento);
  } catch (error) {
    console.error("❌ Error creando levantamiento:", error);
    res.status(500).json({ error: "Error creando levantamiento" });
  }
};

// LISTAR
exports.getLevantamientos = async (req, res) => {
  try {
    const data = await Levantamiento.findAll({
      order: [["createdAt", "DESC"]]
    });
    res.json(data);
  } catch (error) {
    console.error("❌ Error obteniendo levantamientos:", error);
    res.status(500).json({ error: "Error al obtener levantamientos" });
  }
};

// OBTENER UNO
exports.getLevantamientoById = async (req, res) => {
  try {
    const item = await Levantamiento.findByPk(req.params.id);
    if (!item) return res.status(404).json({ msg: "No encontrado" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Error" });
  }
};

// ELIMINAR
exports.deleteLevantamiento = async (req, res) => {
  try {
    await Levantamiento.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando" });
  }
};
