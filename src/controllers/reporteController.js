const path = require('path');
const fs = require('fs');
const { Tarea, Actividad, Sucursal, ClienteNegocio, Evidencia, Usuario } = require('../models/relations');
const PDFDocument = require('pdfkit');

exports.generateReportePDF = async (req, res) => {
  const { tareaId } = req.params;

  try {
    const tarea = await Tarea.findByPk(tareaId, {
      include: [
        { model: Actividad, attributes: ['nombre', 'descripcion'] },
        { model: Sucursal, attributes: ['nombre', 'direccion'] },
        { model: ClienteNegocio, attributes: ['nombre'] },
        { model: Usuario, as: 'AsignadoA', attributes: ['nombre'] },
        { model: Evidencia, attributes: ['titulo', 'archivoUrl', 'createdAt'] }
      ]
    });

    if (!tarea) return res.status(404).json({ message: 'Tarea no encontrada.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Reporte_Tarea_${tareaId}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // ================================
    // ENCABEZADO
    // ================================
    doc.fontSize(18).text('REPORTE DE SERVICIO COMPLETADO', { align: 'center' });
    doc.moveDown();

    // ================================
    // DETALLES DEL SERVICIO
    // ================================
    doc.fontSize(14).text('Detalles del servicio', { underline: true });
    doc.fontSize(12).moveDown(0.5);
    doc.text(`Cliente: ${tarea.ClienteNegocio?.nombre || 'N/A'}`);
    doc.text(`Sucursal: ${tarea.Sucursal?.nombre || 'N/A'}`);
    doc.text(`Dirección: ${tarea.Sucursal?.direccion || 'N/A'}`);
    doc.text(`Actividad: ${tarea.Actividad?.nombre || 'N/A'}`);
    doc.text(`Asignado a: ${tarea.AsignadoA?.nombre || 'N/A'}`);
    doc.text(`Fecha de finalización: ${tarea.createdAt.toLocaleDateString()}`);
    doc.moveDown();

    // ================================
    // EVIDENCIAS CON IMÁGENES
    // ================================
    doc.fontSize(14).text('Evidencias Recopiladas:', { underline: true });
    doc.moveDown(0.5);

    if (!tarea.Evidencia || tarea.Evidencia.length === 0) {
      doc.fontSize(12).text('No hay evidencias registradas.');
    } else {
      for (const ev of tarea.Evidencia) {
        doc.fontSize(12).text(`• ${ev.titulo || 'Evidencia sin título'}`);
        doc.moveDown(0.3);

        // Verificar si hay imagen
        if (ev.archivoUrl) {
          try {
            const imagePath = path.resolve(`./public/uploads/${path.basename(ev.archivoUrl)}`);
            if (fs.existsSync(imagePath)) {
              // Ajustar el tamaño automáticamente al ancho disponible
              const imgY = doc.y; 
              doc.image(imagePath, { fit: [450, 250], align: 'center', valign: 'center' });
              doc.moveDown();
            } else {
              doc.fontSize(10).fillColor('gray').text('(No se encontró la imagen local)');
            }
          } catch (err) {
            console.error('Error al agregar imagen:', err);
            doc.fontSize(10).fillColor('red').text('(Error al cargar imagen)');
          }
        } else {
          doc.fontSize(10).fillColor('gray').text('(Sin imagen adjunta)');
        }

        doc.moveDown(1);
        doc.fillColor('black'); // reset color
      }
    }

    doc.end();

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ message: 'Error al generar PDF' });
  }
};

