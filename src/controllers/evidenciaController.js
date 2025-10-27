// src/controllers/evidenciaController.js
const { Evidencia, Tarea, Usuario } = require('../models/relations');
const { sequelize } = require('../config/database');


// src/controllers/evidenciaController.js

const subirMultiplesEvidencias = async (req, res) => {
  try {
    // ✅ 1. Parámetros correctos
    const { id: tareaId } = req.params;
    const usuarioId = req.user.id;

    // ✅ 2. Archivos y firma
    const files = req.files?.archivos || [];
    const firma = req.files?.firmaCliente?.[0] || null;

    // ✅ 3. Titulos convertidos a array
    const titulos = req.body.titulos ? req.body.titulos.split(',') : [];

    console.log('REQ.PARAMS =>', req.params);
    console.log('REQ.BODY =>', req.body);
    console.log('REQ.FILES =>', req.files);

    // ✅ 4. Validación
    if (!tareaId) {
      return res.status(400).json({ msg: 'Falta el ID de la tarea.' });
    }
    if (files.length === 0 && !firma) {
      return res.status(400).json({ msg: 'No se subieron archivos ni firma.' });
    }

    // ✅ 5. Crear registros en DB
    const evidencias = await Promise.all(
      files.map(async (file, index) => {
        const titulo = titulos[index] || `Evidencia ${index + 1}`;
        return await Evidencia.create({
          tareaId,
          usuarioId,
          titulo,
          archivoUrl: `/uploads/${file.originalname}`,
          firmaClienteUrl: firma ? `/uploads/${firma.originalname}` : null,
        });
      })
    );

    // ✅ Actualizar estado de la tarea al completar
    await Tarea.update(
      { estado: 'Completada' },
      { where: { id: tareaId } }
    );


    console.log('✅ Evidencias guardadas:', evidencias.length);

    res.status(201).json({
      msg: 'Evidencias guardadas correctamente',
      evidencias,
    });

     // generar pdf
    await generarReportePDFInterno(tareaId, usuarioId);


  } catch (error) {
    console.error('❌ Error en subirMultiplesEvidencias:', error);
    res.status(500).json({ msg: 'Error al subir evidencias', error });
  }

  
  console.log("REQ.FILES =>", req.files);
console.log("REQ.BODY =>", req.body);
console.log("REQ.PARAMS =>", req.params);

console.log("🟢 Campos recibidos:", Object.keys(req.body));
console.log("🟣 Archivos recibidos:", req.files?.map(f => f.fieldname));
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
            usuarioId, // Usuario que reporta (obtenido del token)
            datos_recopilados,
            observaciones,
        }, { transaction });

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
        const evidencia = await Evidencia.findOne({
            where: { tareaId },
            include: includeConfig
        });

        if (!evidencia) {
            return res.status(404).json({ message: 'Evidencia no encontrada para esta Tarea.' });
        }

        return res.json(evidencia);
    } catch (error) {
        console.error('Error al obtener evidencia:', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener la evidencia.' });
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
        { model: Evidencia, attributes: ['titulo', 'archivoUrl', 'createdAt'] }
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
          const imgPath = path.join(__dirname, '../../', ev.archivoUrl);
          if (fs.existsSync(imgPath)) {
            doc.image(imgPath, { width: 200 });
          }
        } catch (e) {
          console.warn(`No se pudo agregar imagen: ${e.message}`);
        }
      }
      doc.moveDown();
    }

    doc.end();
    stream.on('finish', () => console.log(`✅ PDF generado: ${pdfPath}`));
  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
  }
}



