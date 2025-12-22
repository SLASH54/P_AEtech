const { Levantamiento } = require("../models/relations");

// CREAR
exports.createLevantamiento = async (req, res) => {
  try {
    const {
      clienteId,
      clienteNombre,
      direccion,
      personal,
      fecha,
      necesidades,
      materiales
    } = req.body;

    const nuevo = await Levantamiento.create({
      clienteId,
      clienteNombre,
      direccion,
      personal,
      fecha,
      necesidades,
      materiales
    });

    res.status(201).json(nuevo);
  } catch (err) {
    console.error("❌ Error creando levantamiento:", err);
    res.status(500).json({ error: "Error creando levantamiento" });
  }
};

// LISTAR
exports.getLevantamientos = async (req, res) => {
  try {
    const list = await Levantamiento.findAll({
      order: [["fecha", "DESC"]]
    });
    res.json(list);
  } catch (err) {
    console.error("❌ Error obteniendo levantamientos:", err);
    res.status(500).json({ error: "Error al obtener levantamientos" });
  }
};

// OBTENER UNO (PARA VER)
exports.getLevantamientoById = async (req, res) => {
  try {
    const lev = await Levantamiento.findByPk(req.params.id);
    if (!lev) return res.status(404).json({ error: "No encontrado" });
    res.json(lev);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener levantamiento" });
  }
};

// ELIMINAR
exports.deleteLevantamiento = async (req, res) => {
  try {
    await Levantamiento.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
};
