const { Levantamiento } = require("../models");

// ===============================
// CREAR LEVANTAMIENTO
// ===============================
exports.createLevantamiento = async (req, res) => {
  try {
    const levantamiento = await Levantamiento.create({
      clienteId: req.body.clienteId,
      clienteNombre: req.body.clienteNombre,
      direccion: req.body.direccion,
      personal: req.body.personal,
      fecha: req.body.fecha,
      necesidades: req.body.necesidades, // 👈 AHORA SÍ
      materiales: req.body.materiales     // 👈 AHORA SÍ
    });

    res.status(201).json(levantamiento);
  } catch (err) {
    console.error("❌ Error creando levantamiento:", err);
    res.status(500).json({ error: "Error creando levantamiento" });
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


// ===============================
// ELIMINAR LEVANTAMIENTO
// ===============================
exports.deleteLevantamiento = async (req, res) => {
  try {
    const { id } = req.params;
    await Levantamiento.destroy({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error("ERROR DELETE:", error);
    res.status(500).json({ msg: "Error al eliminar levantamiento" });
  }
};

// ===============================
// EDITAR LEVANTAMIENTO
// ===============================
exports.updateLevantamiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { direccion, personal, fecha } = req.body;

    await Levantamiento.update(
      { direccion, personal, fecha },
      { where: { id } }
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("ERROR UPDATE:", error);
    res.status(500).json({ msg: "Error al editar levantamiento" });
  }
};




exports.getOne = async (req,res)=>{
  res.json(await Levantamiento.findByPk(req.params.id));
};

exports.update = async (req,res)=>{
  await Levantamiento.update(req.body,{where:{id:req.params.id}});
  res.json({ok:true});
};

exports.remove = async (req,res)=>{
  await Levantamiento.destroy({where:{id:req.params.id}});
  res.json({ok:true});
};




exports.getLevantamientoById = async (req, res) => {
  try {
    const lev = await Levantamiento.findByPk(req.params.id);
    if (!lev) {
      return res.status(404).json({ msg: "Levantamiento no encontrado" });
    }
    res.json(lev);
  } catch (err) {
    console.error("Error obtener levantamiento:", err);
    res.status(500).json({ msg: "Error interno" });
  }
};




