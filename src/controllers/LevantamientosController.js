const { Levantamiento } = require("../models/relations");

// POST – crear levantamiento
exports.createLevantamiento = async (req, res) => {
  try {
    const { clienteId, clienteNombre, direccion, personal, fecha } = req.body;

    const nuevo = await Levantamiento.create({
      clienteId,
      clienteNombre,
      direccion,
      personal,
      fecha
    });

    return res.status(201).json(nuevo);
  } catch (error) {
    console.error("❌ Error creando levantamiento:", error);
    return res.status(500).json({ msg: "Error al crear levantamiento" });
  }
};

// GET – listar levantamientos
exports.getLevantamientos = async (req, res) => {
  try {
    const list = await Levantamiento.findAll({
      order: [["fecha", "DESC"]]
    });
    return res.json(list);
  } catch (error) {
    console.error("❌ Error obteniendo levantamientos:", error);
    return res.status(500).json({ msg: "Error al obtener levantamientos" });
  }
};
