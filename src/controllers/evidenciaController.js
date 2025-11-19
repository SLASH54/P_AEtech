const { Evidencia, Tarea } = require("../models/relations");
const cloudinary = require("../utils/cloudinary");

// ----------------------------------------------------------
//  SUBIR UNA SOLA IMAGEN A CLOUDINARY
// ----------------------------------------------------------
const subirACloudinary = async (archivo) => {
  return await cloudinary.uploader.upload(archivo.path, {
    folder: "aetech_evidencias"
  });
};

// ----------------------------------------------------------
//  SUBIR FIRMA A CLOUDINARY
// ----------------------------------------------------------
const subirFirmaACloudinary = async (archivo) => {
  return await cloudinary.uploader.upload(archivo.path, {
    folder: "aetech_firmas"
  });
};

// ----------------------------------------------------------
//  SUBIR MÚLTIPLES EVIDENCIAS (CORRECTO Y LIMPIO)
// ----------------------------------------------------------
exports.subirMultiplesEvidencias = async (req, res) => {
  try {
    const { tareaId } = req.body;
    const usuarioId = req.usuario.id;

    if (!tareaId) {
      return res.status(400).json({ error: "Falta tareaId" });
    }

    // verificar si vienen archivos
    let evidenciasArchivos = req.files?.evidencias || [];
    let firmaArchivo = req.files?.firma?.[0] || null;

    if (evidenciasArchivos.length === 0) {
      return res.status(400).json({ error: "Se requiere al menos 1 evidencia" });
    }

    // ----------------------------------------------------------
    //   SUBIR IMÁGENES DE EVIDENCIA
    // ----------------------------------------------------------
    const evidenciasGuardadas = [];

    for (const archivo of evidenciasArchivos) {
      const uploadResult = await subirACloudinary(archivo);

      const nueva = await Evidencia.create({
        tareaId,
        usuarioId,
        titulo: archivo.originalname || "Evidencia",
        archivoUrl: uploadResult.secure_url,
        firmaClienteUrl: null,
        materiales: [] // vacío por ahora
      });

      evidenciasGuardadas.push(nueva);
    }

    // ----------------------------------------------------------
    //  SI EXISTE FIRMA, GUARDARLA
    // ----------------------------------------------------------
    if (firmaArchivo) {
      const firmaRes = await subirFirmaACloudinary(firmaArchivo);

      // guardar firma en TODAS las evidencias de la tarea
      await Evidencia.update(
        { firmaClienteUrl: firmaRes.secure_url },
        { where: { tareaId } }
      );
    }

    res.json({
      msg: "Evidencias registradas correctamente",
      evidencias: evidenciasGuardadas
    });

  } catch (error) {
    console.error("Error en subirMultiplesEvidencias:", error);
    return res.status(500).json({ error: "Error interno al subir evidencias" });
  }
};

// ----------------------------------------------------------
//  AGREGAR / ACTUALIZAR MATERIALES DE UNA EVIDENCIA
// ----------------------------------------------------------
exports.actualizarMateriales = async (req, res) => {
  try {
    const { evidenciaId } = req.params;
    const { materiales } = req.body;

    if (!Array.isArray(materiales)) {
      return res.status(400).json({ error: "materiales debe ser un array" });
    }

    const evidencia = await Evidencia.findByPk(evidenciaId);
    if (!evidencia) {
      return res.status(404).json({ error: "Evidencia no encontrada" });
    }

    evidencia.materiales = materiales;
    await evidencia.save();

    res.json({
      msg: "Materiales actualizados correctamente",
      evidencia
    });

  } catch (error) {
    console.error("Error actualizando materiales:", error);
    return res.status(500).json({ error: "Error interno al actualizar materiales" });
  }
};

// ----------------------------------------------------------
//  OBTENER TODAS LAS EVIDENCIAS DE UNA TAREA
// ----------------------------------------------------------
exports.obtenerEvidenciasPorTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;

    const evidencias = await Evidencia.findAll({
      where: { tareaId },
      order: [["createdAt", "ASC"]]
    });

    return res.json(evidencias);

  } catch (error) {
    console.error("Error obteniendo evidencias:", error);
    return res.status(500).json({ error: "Error interno al obtener evidencias" });
  }
};
