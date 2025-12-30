const { Levantamiento } = require("../models");
const cloudinary = require('cloudinary').v2;

// ☁️ Configuración de Cloudinary (Usa tus variables de .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===============================
// 1. CREAR LEVANTAMIENTO
// ===============================
exports.createLevantamiento = async (req, res) => {
  try {
    const { clienteId, clienteNombre, direccion, personal, fecha, necesidades, materiales } = req.body;
    const necesidadesProcesadas = [];

    if (necesidades && necesidades.length > 0) {
      for (const nec of necesidades) {
        let finalUrl = nec.imagen;
        if (nec.imagen && nec.imagen.startsWith('data:image')) {
          const result = await cloudinary.uploader.upload(nec.imagen, {
            folder: 'aetech_levantamientos',
            resource_type: 'auto'
          });
          finalUrl = result.secure_url;
        }
        necesidadesProcesadas.push({ descripcion: nec.descripcion, imagen: finalUrl });
      }
    }

    const nuevo = await Levantamiento.create({
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      direccion,
      personal,
      fecha,
      necesidades: necesidadesProcesadas,
      materiales
    });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error("Error al crear:", error);
    res.status(500).json({ msg: "Error al crear levantamiento" });
  }
};

// ===============================
// 2. OBTENER TODOS
// ===============================
exports.getLevantamientos = async (req, res) => {
  try {
    const lista = await Levantamiento.findAll({ order: [["id", "DESC"]] });
    res.json(lista);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener levantamientos" });
  }
};

// ===============================
// 3. OBTENER POR ID (💡 CRUCIAL PARA EL BOTÓN VER)
// ===============================
exports.getLevantamientoById = async (req, res) => {
  try {
    const { id } = req.params;
    const lev = await Levantamiento.findByPk(id);
    if (!lev) return res.status(404).json({ msg: "No encontrado" });
    res.json(lev);
  } catch (error) {
    res.status(500).json({ msg: "Error interno" });
  }
};

// ===============================
// 4. ACTUALIZAR (EDITAR)
// ===============================
exports.updateLevantamiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { direccion, personal, fecha, necesidades, materiales } = req.body;
    const necesidadesProcesadas = [];

    if (necesidades) {
      for (const nec of necesidades) {
        let finalUrl = nec.imagen;
        if (nec.imagen && nec.imagen.startsWith('data:image')) {
          const result = await cloudinary.uploader.upload(nec.imagen, {
            folder: 'aetech_levantamientos'
          });
          finalUrl = result.secure_url;
        }
        necesidadesProcesadas.push({ descripcion: nec.descripcion, imagen: finalUrl });
      }
    }

    await Levantamiento.update(
      { direccion, personal, fecha, necesidades: necesidadesProcesadas, materiales },
      { where: { id } }
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("Error al editar:", error);
    res.status(500).json({ msg: "Error al editar" });
  }
};

// ===============================
// 5. ELIMINAR
// ===============================
exports.deleteLevantamiento = async (req, res) => {
  try {
    await Levantamiento.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar" });
  }
};