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
