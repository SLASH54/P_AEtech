// src/controllers/evidenciaController.js
const { Evidencia, Tarea, Usuario, Notificacion } = require('../models/relations');
const { sequelize } = require('../config/database');
const { sendPushToUser } = require('../utils/push');



// src/controllers/evidenciaController.js
// ✅ Nueva versión con Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const subirMultiplesEvidencias = async (req, res) => {
  try {
    const { id: tareaId } = req.params;
    const usuarioId = req.user.id;

    const files = req.files?.archivos || [];
    const firmaFile = req.files?.firmaCliente?.[0] || null;
    const titulos = req.body.titulos ? req.body.titulos.split(',') : [];
    const observaciones = req.body.observaciones || ""; 
    
    // 🖊️ Capturamos el nombre que viene del input del frontend
    const nombreFirma = req.body.nombreFirma || ""; 

    // 🧱 PROTECCIÓN: Validar JSON de materiales
    let materiales = [];
    try {
      if (req.body.materiales && req.body.materiales !== "undefined") {
        materiales = typeof req.body.materiales === 'string' 
          ? JSON.parse(req.body.materiales) 
          : req.body.materiales;
      }
    } catch (e) {
      console.error("❌ Error parseando materiales:", e);
      materiales = []; 
    }

    if (!tareaId) return res.status(400).json({ msg: 'Falta el ID de la tarea.' });
    if (files.length === 0 && !firmaFile)
      return res.status(400).json({ msg: 'No se subieron archivos ni firma.' });

    // 1️⃣ SUBIR LA FIRMA A CLOUDINARY
    let firmaUrl = null;
    if (firmaFile) {
      const firmaResult = await cloudinary.uploader.upload(firmaFile.path, {
        folder: 'aetech_firmas',
        resource_type: 'auto'
      });
      firmaUrl = firmaResult.secure_url;
    }

    // 🟢 CORRECCIÓN DE VARIABLE (CamelCase)
    const evidenciasCreadas = [];

    // 2️⃣ CREAR REGISTROS EN LA DB
    const totalIteraciones = files.length > 0 ? files.length : 1;

    for (let i = 0; i < totalIteraciones; i++) {
      let fotoUrl = null;
      let tituloActual = titulos[i] || `Evidencia ${i + 1}`;

      if (files[i]) {
        const result = await cloudinary.uploader.upload(files[i].path, {
          folder: 'aetech_evidencias',
          resource_type: 'auto'
        });
        fotoUrl = result.secure_url;
      }

      // 💾 Guardamos en la DB de Render
      const nuevaEvidencia = await Evidencia.create({
        tareaId,
        usuarioId,
        // Si es el primer registro y no hay foto, le ponemos que es la firma
        titulo: (i === 0 && !files[i]) ? "Firma de Conformidad" : tituloActual,
        archivoUrl: fotoUrl,
        firmaClienteUrl: i === 0 ? firmaUrl : null, 
        nombreFirma: i === 0 ? nombreFirma : null,  // 👈 AQUÍ SE GUARDA EL NOMBRE
        observaciones: i === 0 ? observaciones : null, 
        materiales: i === 0 ? materiales : []      
      });

      evidenciasCreadas.push(nuevaEvidencia);
    }

    // ✅ Actualizar estado de la tarea
    await Tarea.update({ estado: 'Completada' }, { where: { id: tareaId } });
    
    // Notificaciones Push
    const tarea = await Tarea.findByPk(tareaId);
    await Notificacion.update({ leida: true }, { where: { tareaId } });

    if (tarea?.usuarioAsignadoId) {
      sendPushToUser(
        tarea.usuarioAsignadoId,
        'Tarea completada ✔',
        `Se completó: ${tarea.nombre}`,
        { tareaId: String(tarea.id) }
      );
    }

    res.status(201).json({
      msg: 'Evidencias guardadas correctamente',
      evidencias: evidenciasCreadas
    });

  } catch (error) {
    console.error('❌ Error al subir evidencias:', error);
    res.status(500).json({ msg: 'Error interno.', error: error.message });
  }
};


// Configuración de inclusión para GET (mostrar detalles de la Tarea relacionada)
const includeConfig = [
    { model: Tarea, include: [
        { model: Usuario, as: 'AsignadoA', attributes: ['nombre', 'rol'] }
    ]},
    { model: Usuario, as: 'Autor', attributes: ['nombre', 'rol'] }
];

// 1. Registrar Evidencia (POST) - Solo Residente/Practicante
exports.createEvidencia = async (req, res) => {
    // El usuarioId se obtiene del token de autenticación (req.user.id)
    const usuarioId = req.user.id;
    const { tareaId, datos_recopilados, observaciones } = req.body;

    // Usamos una transacción para asegurar la consistencia de los datos
    const transaction = await sequelize.transaction();

    try {
        if (!tareaId || !datos_recopilados) {
            return res.status(400).json({ message: 'Faltan el ID de la Tarea y los datos recopilados.' });
        }

        // 1. Verificar que la Tarea exista y esté pendiente
        const tarea = await Tarea.findByPk(tareaId, { transaction });
        if (!tarea) {
            await transaction.rollback();
            return res.status(404).json({ message: 'La Tarea especificada no existe.' });
        }
        if (tarea.estado !== 'Pendiente' && tarea.estado !== 'En Progreso') {
            await transaction.rollback();
            return res.status(400).json({ message: 'La Tarea ya está en estado: ${tarea.estado}.' });
        }


        
     // 2. Crear la Evidencia
const evidencia = await Evidencia.create({
  tareaId,
  usuarioId,
  datos_recopilados,
  observaciones
});





        // 3. Actualizar la Tarea a 'Completada'
        await Tarea.update(
            { estado: 'Completada' },
            { where: { id: tareaId }, transaction }
        );

        // 4. Confirmar la transacción
        await transaction.commit();
        
        return res.status(201).json({ message: 'Evidencia registrada y Tarea completada con éxito.', evidencia });

    } catch (error) {
        // Si algo falla, revertir los cambios
        await transaction.rollback();
        console.error('Error al registrar evidencia:', error);
        return res.status(500).json({ message: 'Error interno del servidor al crear la evidencia.' });
    }
};

// 2. Obtener TODAS las Evidencias (GET) - Admin/Ingeniero (Roles de Monitoreo)
exports.getAllEvidencias = async (req, res) => {
    try {
        const evidencias = await Evidencia.findAll({ 
            include: includeConfig,
            order: [['createdAt', 'DESC']]
        });
        return res.json(evidencias);
    } catch (error) {
        console.error('Error al obtener evidencias:', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener las evidencias.' });
    }
};

// 3. Obtener Evidencias por Tarea (GET por ID) - Todos los roles con permiso de lectura
exports.getEvidenciaByTareaId = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const evidencias = await Evidencia.findAll({
      where: { tareaId },
      order: [['createdAt', 'ASC']]
    });

    if (!evidencias || evidencias.length === 0) {
      return res.status(404).json({ message: 'No se encontraron evidencias para esta tarea.' });
    }

    return res.json(evidencias);
  } catch (error) {
    console.error('Error al obtener evidencias:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener las evidencias.' });
  }
};



exports.getEvidenciasByTarea = async (req, res) => {
try {
const { tareaId } = req.params;
const list = await Evidencia.findAll({ where: { tareaId }, order: [['createdAt','DESC']] });
return res.json(list);
} catch (err) {
console.error(err);
return res.status(500).json({ msg: 'Error al obtener evidencias' });
}
};


// ... (todas tus funciones anteriores)

// ✅ Exportación de todas las funciones
module.exports = {
  subirMultiplesEvidencias,
  createEvidencia: exports.createEvidencia,
  getAllEvidencias: exports.getAllEvidencias,
  getEvidenciaByTareaId: exports.getEvidenciaByTareaId,
  getEvidenciasByTarea: exports.getEvidenciasByTarea,
};


//pdf 

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generarReportePDFInterno(tareaId, usuarioId) {
  try {
    const tarea = await Tarea.findByPk(tareaId, {
      include: [
        { model: Actividad, attributes: ['nombre', 'descripcion'] },
        { model: Sucursal, attributes: ['nombre', 'direccion'] },
        { model: ClienteNegocio, attributes: ['nombre'] },
        { model: Usuario, as: 'AsignadoA', attributes: ['nombre', 'rol'] },
        { model: Evidencia, attributes: ['titulo', 'archivoUrl', 'createdAt', 'materiales'] }
      ]
    });

    if (!tarea) return console.warn(`No se encontró tarea con ID ${tareaId}`);

    // 📄 Crear directorio de reportes si no existe
    const reportsDir = path.join(__dirname, '../../uploads/reportes');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    // 🧾 Crear PDF
    const pdfPath = path.join(reportsDir, `Reporte_Tarea_${tareaId}.pdf`);
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Encabezado
    doc.fontSize(20).text('Reporte de Evidencias', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
    doc.moveDown();

    // Evidencias
    doc.fontSize(14).text('Evidencias Subidas:', { underline: true });
    doc.moveDown(0.5);

    for (const ev of tarea.Evidencia) {
      doc.fontSize(12).text(`• ${ev.titulo}`);
      if (ev.archivoUrl) {
  try {
    doc.image(ev.archivoUrl, { width: 200 });
  } catch {
    doc.text(`(No se pudo cargar la imagen: ${ev.archivoUrl})`);
  }
}
      doc.moveDown();
    }


    // === 🧱 MATERIALES OCUPADOS ===
const evidenciaConMateriales = tarea.Evidencia.find(ev => ev.materiales && ev.materiales.length > 0);
if (evidenciaConMateriales) {
  doc.addPage();
  doc.fontSize(14).fillColor('#003366').text('🧱 Material Ocupado', { underline: true });
  doc.moveDown(0.5);
  doc.fillColor('black');

  try {
    const listaMateriales = Array.isArray(evidenciaConMateriales.materiales)
      ? evidenciaConMateriales.materiales
      : JSON.parse(evidenciaConMateriales.materiales || '[]');

    listaMateriales.forEach(m => {
      doc.fontSize(12).text(`• ${m}`);
    });
  } catch (err) {
    doc.fontSize(12).fillColor('gray').text('(Error al mostrar materiales)');
  }

  doc.moveDown();
}


    doc.end();
    stream.on('finish', () => console.log(`✅ PDF generado: ${pdfPath}`));
  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
  }
}



