const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { tareaId } = req.params;
const id = typeof tareaId === 'object' ? tareaId.tareaId : tareaId;

const { Tarea, Actividad, Sucursal, ClienteNegocio, Evidencia, Usuario } = require('../models/relations');

async function generateReportePDF(tareaId, usuarioId) {
  try {
    const tarea = await Tarea.findByPk(Number(id), {
      include: [
        { model: Actividad, attributes: ['nombre', 'descripcion'] },
        { model: Sucursal, attributes: ['nombre', 'direccion'] },
        { model: ClienteNegocio, attributes: ['nombre'] },
        { model: Usuario, as: 'AsignadoA', attributes: ['nombre', 'rol'] },
        { model: Evidencia, attributes: ['titulo', 'archivoUrl', 'firmaClienteUrl', 'createdAt'] }
      ]
    });

    if (!tarea) return console.warn(`⚠️ No se encontró tarea con ID ${tareaId}`);

    // 📄 Crear directorio de reportes si no existe
    const reportsDir = path.join(__dirname, '../../uploads/reportes');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const pdfPath = path.join(reportsDir, `Reporte_Tarea_${tareaId}.pdf`);
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // 🔹 ENCABEZADO
    doc.fontSize(18).text('REPORTE DE SERVICIO COMPLETADO', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Detalles del servicio', { underline: true });
    doc.fontSize(12).moveDown(0.5);
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
    doc.text(`Fecha de finalización: ${tarea.createdAt.toLocaleDateString()}`);
    doc.moveDown();

    // 🔹 EVIDENCIAS
    doc.fontSize(14).text('Evidencias Recopiladas:', { underline: true });
    doc.moveDown(0.5);

    for (const ev of tarea.Evidencia) {
      doc.fontSize(12).text(`• ${ev.titulo}`);

      if (ev.archivoUrl) {
        try {
          // 📥 Descargar imagen desde Cloudinary
          const response = await axios.get(ev.archivoUrl, { responseType: 'arraybuffer' });
          const imgBuffer = Buffer.from(response.data, 'binary');
          doc.image(imgBuffer, { width: 200 });
        } catch (e) {
          doc.fillColor('gray').text('(No se pudo cargar la imagen desde Cloudinary)');
          doc.fillColor('black');
        }
      }

      doc.moveDown();
    }

    // 🔹 FIRMA DEL CLIENTE
    const evidenciaConFirma = tarea.Evidencia.find(ev => ev.firmaClienteUrl);
    if (evidenciaConFirma?.firmaClienteUrl) {
      doc.addPage();
      doc.fontSize(14).text('Firma del Cliente', { align: 'center', underline: true });
      doc.moveDown();

      try {
        const firmaResp = await axios.get(evidenciaConFirma.firmaClienteUrl, { responseType: 'arraybuffer' });
        const firmaBuffer = Buffer.from(firmaResp.data, 'binary');
        doc.image(firmaBuffer, {
          fit: [250, 150],
          align: 'center',
          valign: 'center'
        });
      } catch {
        doc.fillColor('gray').text('(No se pudo cargar la firma desde Cloudinary)', { align: 'center' });
        doc.fillColor('black');
      }
    }

    doc.end();
    stream.on('finish', () => console.log(`✅ PDF generado correctamente: ${pdfPath}`));

  } catch (error) {
    console.error('❌ Error al generar reporte PDF:', error);
  }
}

module.exports = { generateReportePDF };