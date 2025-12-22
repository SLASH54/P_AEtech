const { Levantamiento } = require("../models/relations");

// CREAR
exports.createLevantamiento = async (req, res) => {
  try {
    const levantamiento = await Levantamiento.create(req.body);
    res.status(201).json(levantamiento);
  } catch (error) {
    console.error("❌ Error creando levantamiento:", error);
    res.status(500).json({ msg: "Error creando levantamiento" });
  }
};

// LISTAR
exports.getLevantamientos = async (req, res) => {
  try {
    const list = await Levantamiento.findAll({
      order: [["createdAt", "DESC"]]
    });
    res.json(list);
  } catch (error) {
    console.error("❌ Error obteniendo levantamientos:", error);
    res.status(500).json({ msg: "Error al obtener levantamientos" });
  }
};

