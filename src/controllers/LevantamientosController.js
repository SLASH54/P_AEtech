const { Levantamiento } = require("../models");

// ===============================
// CREAR LEVANTAMIENTO
// ===============================
exports.createLevantamiento = async (req, res) => {
  try {
    const {
      clienteId,
      clienteNombre,
      direccion,
      personal,
      fecha
    } = req.body;

    const nuevo = await Levantamiento.create({
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      direccion,
      personal,
      fecha
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error("ERROR CREATE LEVANTAMIENTO:", error);
    res.status(500).json({ msg: "Error al crear levantamiento" });
  }
};

// ===============================
// OBTENER LEVANTAMIENTOS
// ===============================
exports.getLevantamientos = async (req, res) => {
  try {
    const lista = await Levantamiento.findAll({
      order: [["id", "DESC"]]
    });

    res.json(lista);
  } catch (error) {
    console.error("ERROR GET LEVANTAMIENTOS:", error);
    res.status(500).json({ msg: "Error al obtener levantamientos" });
  }
};


exports.deleteLevantamiento = async (req, res) => {
  try {
    const { id } = req.params;
    await Levantamiento.destroy({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ msg: "Error al eliminar" });
  }
};


exports.updateLevantamiento = async (req, res) => {
  const { id } = req.params;
  const { direccion, personal, fecha } = req.body;

  await Levantamiento.update(
    { direccion, personal, fecha },
    { where: { id } }
  );

  res.json({ ok: true });
};
