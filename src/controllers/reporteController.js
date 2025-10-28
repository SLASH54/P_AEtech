const PDFDocument = require('pdfkit'); 
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Tarea, Actividad, Sucursal, ClienteNegocio, Evidencia, Usuario } = require('../models/relations');

// 🔹 Controlador principal
exports.generateReportePDF = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const id = typeof tareaId === 'object' ? tareaId.tareaId : tareaId;

    const tarea = await Tarea.findByPk(Number(id), {
      include: [
        { model: Actividad, attributes: ['nombre', 'descripcion'] },
        { model: Sucursal, attributes: ['nombre', 'direccion'] },
        { model: ClienteNegocio, attributes: ['nombre'] },
        { model: Usuario, as: 'AsignadoA', attributes: ['nombre', 'rol'] },
        { model: Evidencia, attributes: ['titulo', 'archivoUrl', 'firmaClienteUrl', 'createdAt'] }
      ]
    });

    if (!tarea) {
      return res.status(404).json({ message: `No se encontró la tarea con ID ${id}` });
    }

    // 📄 Configurar cabeceras para el PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Reporte_Tarea_${id}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

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

  } catch (error) {
    console.error('❌ Error al generar reporte PDF:', error);
    res.status(500).json({ message: 'Error interno al generar el PDF' });
  }
};


//module.exports = { generateReportePDF };