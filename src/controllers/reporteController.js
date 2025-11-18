const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const { Tarea, Actividad, Sucursal, ClienteNegocio, Evidencia, Usuario } = require('../models/relations');

const publicDir = path.join(__dirname, '..', 'public');

exports.generateReportePDF = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const id = Number(typeof tareaId === 'object' ? tareaId.tareaId : tareaId);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID de tarea inválido' });
    }

    const tarea = await Tarea.findByPk(id, {
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

    // ==========================
    // CONFIGURACIÓN PDF
    // ==========================
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Reporte_Tarea_${id}.pdf"`);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    doc.pipe(res);

    const logoPath = path.join(publicDir, 'logo.png');
    const watermarkPath = path.join(publicDir, 'watermark.png');

    // ==========================
    // FUNCIONES DE ESTILO
    // ==========================
    const drawWatermark = () => {
      try {
        if (fs.existsSync(watermarkPath)) {
          const w = 350;
          const x = (doc.page.width - w) / 2;
          const y = (doc.page.height - w) / 2;
          doc.save();
          doc.opacity(0.08);
          doc.image(watermarkPath, x, y, { width: w });
          doc.restore();
        }
      } catch (e) {
        console.log('Watermark error:', e.message);
      }
    };

    const drawHeader = () => {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 30, { width: 80 });
      }
      doc.fontSize(18).fillColor('#003366').text('AE TECH', 150, 40);
      doc.fontSize(11).fillColor('#777777').text('Reporte oficial de servicio', 150, 60);
      doc.moveTo(50, 90).lineTo(doc.page.width - 50, 90).stroke('#003366');
      doc.moveDown(2);
    };

    doc.on('pageAdded', () => {
      drawWatermark();
      drawHeader();
    });

    // ==========================
    // PRIMERA PÁGINA
    // ==========================
    drawWatermark();
    drawHeader();

    // --- Datos de la tarea ---
    doc.fontSize(14).fillColor('#003366').text('Trabajo realizado', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#000000').text(tarea.titulo || 'Sin título');
    doc.moveDown(1.2);

    doc.fontSize(14).fillColor('#003366').text('Detalles del servicio');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#222222');

    const clienteNombre = tarea.ClienteNegocio?.nombre || 'N/A';
    const clienteDir = tarea.ClienteNegocio?.direccion || 'N/A';
    const sucursalNombre = tarea.Sucursal?.nombre || 'N/A';
    const sucursalDir = tarea.Sucursal?.direccion || 'Sin dirección';
    const actividadNombre = tarea.Actividad?.nombre || 'N/A';
    const responsable = tarea.AsignadoA?.nombre || 'N/A';
    const rol = tarea.AsignadoA?.rol || 'N/A';
    const fechaFin = tarea.createdAt
      ? new Date(tarea.createdAt).toLocaleDateString('es-MX')
      : 'Sin fecha';

    doc.text(`Cliente: ${clienteNombre}`);
    doc.text(`Dirección del Cliente: ${clienteDir}`);
    doc.text(`Sucursal: ${sucursalNombre} — ${sucursalDir}`);
    doc.text(`Actividad: ${actividadNombre}`);
    doc.text(`Asignado a: ${responsable} (${rol})`);
    doc.text(`Fecha de finalización: ${fechaFin}`);

    doc.moveDown(1.5);

    // ==========================
    // EVIDENCIAS
    // ==========================
    doc.fontSize(14).fillColor('#003366').text('Evidencias recopiladas');
    doc.moveDown(0.8);

    const evidenciasOrdenadas = Array.isArray(tarea.Evidencia)
      ? [...tarea.Evidencia].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return da - db;
        })
      : [];

    const MAX_WIDTH = 380;
    const MAX_HEIGHT = 500;

    for (const ev of evidenciasOrdenadas) {
      doc.fontSize(12).fillColor('#333333').text(`• ${ev.titulo || 'Evidencia'}`);
      doc.moveDown(0.4);

      if (ev.archivoUrl) {
        try {
          const response = await axios.get(ev.archivoUrl, { responseType: 'arraybuffer' });
          const jpegBuffer = await sharp(response.data)
            .rotate()
            .resize({
              width: MAX_WIDTH,
              height: MAX_HEIGHT,
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          const img = doc.openImage(jpegBuffer);

          // salto de página si no cabe
          const bottomMargin = 80;
          if (doc.y + img.height > doc.page.height - bottomMargin) {
            doc.addPage();
          }

          const xImg = (doc.page.width - img.width) / 2;
          doc.image(jpegBuffer, xImg, doc.y);
          doc.moveDown(1.4);
        } catch (e) {
          console.log('Error cargando evidencia:', ev.archivoUrl, e.message);
          doc.fillColor('red').fontSize(10).text('⚠ No se pudo cargar esta imagen.');
          doc.moveDown(1);
        }
      } else {
        doc.fillColor('#555555').fontSize(10).text('(Sin archivo de imagen)');
        doc.moveDown(0.8);
      }
    }

    // ==========================
    // FIRMA DEL CLIENTE
    // ==========================
    const evFirma = evidenciasOrdenadas.find(e => e.firmaClienteUrl);

    if (evFirma && evFirma.firmaClienteUrl) {
      doc.addPage();
      doc.fontSize(16).fillColor('#003366').text('Firma del cliente', { align: 'center' });
      doc.moveDown(1.2);

      try {
        const responseFirma = await axios.get(evFirma.firmaClienteUrl, { responseType: 'arraybuffer' });
        const firmaBuffer = await sharp(responseFirma.data)
          .rotate()
          .resize({ width: 300, height: 200, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        const imgFirma = doc.openImage(firmaBuffer);
        const xFirma = (doc.page.width - imgFirma.width) / 2;

        doc.image(firmaBuffer, xFirma, doc.y);
        doc.moveDown(2);
      } catch (e) {
        console.log('Error cargando firma:', e.message);
        doc.fillColor('red').fontSize(10).text('⚠ No se pudo cargar la firma del cliente.', { align: 'center' });
        doc.moveDown(1.5);
      }
    }

    // ==========================
    // MATERIALES
    // ==========================
    const materialesRaw = [];

    if (Array.isArray(tarea.Evidencia)) {
      tarea.Evidencia.forEach(ev => {
        if (!ev.materiales) return;

        try {
          if (Array.isArray(ev.materiales)) {
            materialesRaw.push(...ev.materiales);
          } else {
            const parsed = JSON.parse(ev.materiales);
            if (Array.isArray(parsed)) {
              materialesRaw.push(...parsed);
            }
          }
        } catch (e) {
          console.log('Material inválido en evidencia:', e.message);
        }
      });
    }

    if (materialesRaw.length > 0) {
      doc.addPage();

      doc.fontSize(16).fillColor('#003366').text('Material ocupado');
      doc.moveDown(0.8);

      const grupos = {};
      materialesRaw.forEach(m => {
        const cat = m.categoria || 'Otros';
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push(m);
      });

      const categorias = Object.keys(grupos).sort();

      categorias.forEach(cat => {
        doc.fontSize(13).fillColor('#003366').text(cat);
        doc.moveDown(0.2);

        grupos[cat]
          .sort((a, b) => (a.insumo || '').localeCompare(b.insumo || ''))
          .forEach(m => {
            doc.fontSize(11).fillColor('#222222').text(`• ${m.insumo} — ${m.cantidad} ${m.unidad}`);
          });

        doc.moveDown(0.8);
      });
    }

    // ==========================
    // FOOTER
    // ==========================
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#777777').text('AE TECH · Reporte oficial generado por el sistema', {
      align: 'center'
    });

    doc.end();
  } catch (err) {
    console.error('❌ Error PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error interno generando PDF' });
    } else {
      res.end();
    }
  }
};
