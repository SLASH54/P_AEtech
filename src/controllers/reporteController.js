const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const { Tarea, Actividad, Sucursal, ClienteNegocio, Evidencia, Usuario } = require('../models/relations');

// 📁 Carpeta public: src/public (logo.png, watermark.png)
const publicDir = path.join(__dirname, '..', 'public');

// =============================
// 🔵 HELPERS VISUALES
// =============================

// Marca de agua centrada en la página

function drawWatermark(doc) {
  try {
    const watermarkPath = path.join(publicDir, 'watermark.png');
    if (!fs.existsSync(watermarkPath)) return;

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.save();
    doc.opacity(0.09); // visible pero suave
    doc.image(
      watermarkPath,
      pageWidth / 2 - 220,
      pageHeight / 2 - 220,
      { width: 440 }
    );
    doc.opacity(1);
    doc.restore();
  } catch (e) {
    console.log('Error watermark:', e.message);
  }
}

// Encabezado corporativo

function drawHeader(doc) {
  const headerY = 20;

  // LOGO
  doc.image(path.join(publicDir, 'logo.png'), 40, headerY, {
    width: 90
  });

  // TÍTULO
  doc.fontSize(16)
     .fillColor("#0A3D62")
     .text("AE TECH", 140, headerY + 10);

  doc.fontSize(10)
     .fillColor("#555")
     .text("Reporte oficial de servicio", 140, headerY + 30);

  // LINEA
  doc.moveTo(40, headerY + 60)
     .lineTo(doc.page.width - 40, headerY + 60)
     .stroke("#0A3D62");
}




// Footer sencillo
function drawFooter(doc) {
  const footerY = doc.page.height - 40;
  doc.moveTo(40, footerY).lineTo(550, footerY).strokeColor('#003366');
  doc.fontSize(9).fillColor('#555');
  doc.text('AE TECH · Reporte generado por sistema interno', 40, footerY + 5, {
    align: 'center'
  });
}

// Detalles de la tarea
function drawServiceDetails(doc, tarea) {
  const trabajoRealizado =
    tarea.titulo ||
    tarea.nombre ||
    (tarea.Actividad && tarea.Actividad.nombre) ||
    '';

  doc.fontSize(17).fillColor('#003366')
    .text('📋 Detalles del servicio', { underline: true });
  doc.moveDown();

  doc.fontSize(12).fillColor('#222');
  doc.text(`Trabajo realizado: ${trabajoRealizado}`);
  doc.text(`Cliente: ${tarea.ClienteNegocio?.nombre || ''}`);
  doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio?.direccion || ''}`);
  doc.text(`Sucursal: ${tarea.Sucursal?.nombre || ''}`);
  doc.text(`Dirección de Sucursal: ${tarea.Sucursal?.direccion || ''}`);
  doc.text(`Actividad: ${tarea.Actividad?.nombre || ''}`);
  doc.text(
    `Asignado a: ${tarea.AsignadoA?.nombre || ''}` +
    (tarea.AsignadoA?.rol ? ` (${tarea.AsignadoA.rol})` : '')
  );

  const fechaFin = tarea.createdAt
    ? new Date(tarea.createdAt).toLocaleDateString('es-MX')
    : 'Sin fecha';
  doc.text(`Fecha de finalización: ${fechaFin}`);

  doc.moveDown(1);
  doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#cccccc');
  doc.moveDown(1.5);
}

// Evidencias con imágenes optimizadas
async function drawEvidences(doc, evidencias) {
  if (!evidencias || evidencias.length === 0) return;

  doc.fontSize(17).fillColor('#003366')
    .text('Evidencias Recopiladas', { underline: true });
  doc.moveDown(1);

  const MAX_WIDTH = 420;
  const MAX_HEIGHT = 420;

  for (const ev of evidencias) {
    // Título de la evidencia
    doc.fontSize(12).fillColor('black')
      .text(`• ${ev.titulo || 'Evidencia'}`);
    doc.moveDown(0.3);

    if (!ev.archivoUrl) {
      doc.fillColor('gray').text('(Sin imagen asociada)');
      doc.fillColor('black');
      doc.moveDown(0.5);
      continue;
    }

    try {
      const response = await axios.get(ev.archivoUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxContentLength: 7 * 1024 * 1024 // 7MB
      });

      // Optimizar imagen: rotación + tamaño + compresión
      const jpegBuffer = await sharp(response.data)
        .rotate()
        .resize({
          width: 1280,
          height: 1280,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 72 })
        .toBuffer();

      const img = doc.openImage(jpegBuffer);

      const scale = Math.min(
        MAX_WIDTH / img.width,
        MAX_HEIGHT / img.height,
        1
      );
      const w = img.width * scale;
      const h = img.height * scale;

      // Si no cabe en esta página, saltar a la siguiente
      if (doc.y + h > doc.page.height - 80) {
        doc.addPage();
      }

      const x = (doc.page.width - w) / 2;
      doc.image(jpegBuffer, x, doc.y, { width: w, height: h });
      doc.moveDown(1.2);
    } catch (e) {
      console.log('⚠ Error procesando imagen:', ev.archivoUrl, e.message);
      doc.fillColor('gray').text('(Imagen no disponible)');
      doc.fillColor('black');
      doc.moveDown(0.8);
    }
  }
}

// Firma del cliente
async function drawSignature(doc, evidencias) {
  if (!evidencias || evidencias.length === 0) return;
  const evFirma = evidencias.find(ev => ev.firmaClienteUrl);
  if (!evFirma?.firmaClienteUrl) return;

  doc.addPage();

  doc.fontSize(18).fillColor('#003366')
    .text('Firma del Cliente', { align: 'center', underline: true });
  doc.moveDown(1.5);

  try {
    const resp = await axios.get(evFirma.firmaClienteUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });
    const firmaBuffer = Buffer.from(resp.data);
    const width = 250;
    const x = (doc.page.width - width) / 2;

    doc.image(firmaBuffer, x, doc.y, { width });
  } catch (e) {
    console.log('⚠ Error firma:', e.message);
    doc.fillColor('gray').text('(No se pudo cargar la firma)', {
      align: 'center'
    });
    doc.fillColor('black');
  }

  doc.moveDown(2);
}

// Materiales agrupados por categoría
function drawMaterials(doc, evidencias) {
  if (!evidencias || evidencias.length === 0) return;

  const materialesRaw = [];

  evidencias.forEach(ev => {
    if (!ev.materiales) return;

    try {
      let parsed = ev.materiales;

      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      if (Array.isArray(parsed)) {
        parsed.forEach(m => materialesRaw.push(m));
      } else if (parsed && typeof parsed === 'object') {
        materialesRaw.push(parsed);
      }
    } catch (e) {
      console.log('Materiales inválidos en evidencia:', e.message);
    }
  });

  if (materialesRaw.length === 0) return;

  // Agrupar por categoría
  const grupos = {};
  materialesRaw.forEach(m => {
    if (!m) return;
    const cat = m.categoria || 'Otros';
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(m);
  });

  doc.addPage();

  doc.fontSize(18).fillColor('#003366')
    .text('Material Ocupado', { underline: true, align: 'center' });
  doc.moveDown(1);

  const categoriasOrdenadas = Object.keys(grupos).sort();

  categoriasOrdenadas.forEach(cat => {
    doc.fontSize(15).fillColor('#444').text(`• ${cat}`);
    doc.moveDown(0.3);

    grupos[cat]
      .sort((a, b) => (a.insumo || '').localeCompare(b.insumo || ''))
      .forEach(m => {
        const linea = `   - ${m.insumo || ''} — ${m.cantidad || 0} ${m.unidad || ''}`;
        doc.fontSize(12).fillColor('#222').text(linea);
      });

    doc.moveDown(0.8);
  });
}

// =============================
// 🔵 CONTROLADOR PRINCIPAL
// =============================
exports.generateReportePDF = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const id = typeof tareaId === 'object' ? tareaId.tareaId : tareaId;

    const tarea = await Tarea.findByPk(Number(id), {
      include: [
        { model: Actividad, attributes: ['nombre', 'descripcion'] },
        { model: Sucursal, attributes: ['nombre', 'direccion'] },
        { model: ClienteNegocio, attributes: ['nombre', 'direccion'] },
        { model: Usuario, as: 'AsignadoA', attributes: ['nombre', 'rol'] },
        { model: Evidencia, attributes: ['titulo', 'archivoUrl', 'firmaClienteUrl', 'createdAt', 'materiales'] }
      ]
    });

    if (!tarea) {
      return res.status(404).json({ message: `No se encontró la tarea con ID ${id}` });
    }

    // 📄 Cabeceras
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Reporte_Tarea_${id}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Marca de agua y header en TODAS las páginas nuevas
    doc.on('pageAdded', () => {
      drawWatermark(doc);
      drawHeader(doc, tarea);
      drawFooter(doc);
    });

    // Primera página
    drawWatermark(doc);
    drawHeader(doc, tarea);
    drawFooter(doc);

    // Detalles del servicio
    drawServiceDetails(doc, tarea);

    // Evidencias con imágenes optimizadas
    await drawEvidences(doc, tarea.Evidencia);

    // Firma del cliente
    await drawSignature(doc, tarea.Evidencia);

    // Materiales agrupados
    drawMaterials(doc, tarea.Evidencia);

    // Cerrar PDF
    doc.end();
  } catch (err) {
    console.error('❌ Error generando PDF:', err);
    // Evita mandar dos respuestas
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error interno al generar el PDF' });
    }
  }
};
