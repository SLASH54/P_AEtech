// ==============================
//       REPORTE PDF AETECH
// ==============================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const { 
  Tarea, Actividad, Sucursal, ClienteNegocio, Usuario, Evidencia 
} = require("../models/relations");

// -----------------------------------------------------------
// UTIL: Procesar imagen (rotar + comprimir + redimensionar)
// -----------------------------------------------------------
async function procesarImagen(url, maxW, maxH) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate()
      .resize({ width: maxW, height: maxH, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.log("Error procesando imagen:", url, err.message);
    return null;
  }
}

// -----------------------------------------------------------
// UTIL: Dibujar marca de agua AETECH
// -----------------------------------------------------------
async function cargarMarcaAgua() {
  const watermarkPath = path.join(__dirname, "../public/watermark.png");

  if (!fs.existsSync(watermarkPath)) return null;

  return fs.readFileSync(watermarkPath);
}

function dibujarMarcaAgua(doc, wm) {
  if (!wm) return;

  doc.save();
  doc.opacity(0.08);

  const w = 350;
  const x = (doc.page.width - w) / 2;
  const y = 180;

  doc.image(wm, x, y, { width: w });

  doc.restore();
}

// -----------------------------------------------------------
//                GENERAR REPORTE PDF
// -----------------------------------------------------------
exports.generateReportePDF = async (req, res) => {
  const { tareaId } = req.params;

  try {
    const { tareaId } = req.params;

    const tarea = await Tarea.findOne({
      where: { id: tareaId },
      include: [
        { model: Actividad },
        { model: Sucursal },
        { model: ClienteNegocio },
        { model: Usuario, as: "AsignadoA" },
        { model: Evidencia }
      ]
    });

    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    const evidencias = tarea.Evidencia || [];

    // PDF config
    const doc = new PDFDocument({ size: "LETTER", margin: 40 });

    // STREAM PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Reporte_Tarea_${tareaId}.pdf`);
    doc.pipe(res);

    // Cargar marca de agua
    const watermark = await cargarMarcaAgua();

    // ========================================================
    // ENCABEZADO
    // ========================================================
    dibujarMarcaAgua(doc, watermark);

    doc.fontSize(22).fillColor("#004b85").text("AE TECH");
    doc.fontSize(12).fillColor("black").text("Reporte oficial de servicio");
    doc.moveDown(1);

    // DATOS
    doc.fontSize(18).fillColor("#004b85").text("Detalles del servicio", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor("black")
      .text(`Trabajo realizado: ${tarea.nombre}`)
      .text(`Cliente: ${tarea.ClienteNegocio.nombre}`)
      .text(`Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`)
      .text(`Sucursal: ${tarea.Sucursal.nombre}`)
      .text(`Dirección de la Sucursal: ${tarea.Sucursal.direccion}`)
      .text(`Actividad: ${tarea.Actividad.nombre}`)
      .text(`Asignado a: ${tarea.AsignadoA.nombre}`)
      .text(`Fecha finalización: ${tarea.fechaLimite}`);

    doc.moveDown(1);

    // ========================================================
    // EVIDENCIAS (2 por página)
    // ========================================================
    if (evidencias.length > 0) {
      doc.addPage();
      dibujarMarcaAgua(doc, watermark);

      doc.fontSize(18).fillColor("#004b85").text("Evidencias", { underline: true });
      doc.moveDown(1);

      const MAX_W = 260;
      const MAX_H = 260;

      let counter = 0;

      for (const ev of evidencias) {
        if (counter === 2) {
          doc.addPage();
          dibujarMarcaAgua(doc, watermark);
          counter = 0;
        }

        const img = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);

        if (img) {
          const x = (doc.page.width - MAX_W) / 2;
          doc.fontSize(12).fillColor("black").text(ev.titulo || "Evidencia");
          doc.image(img, x, doc.y, { width: MAX_W });
          doc.moveDown(1);
        }

        counter++;
      }
    }

    // ========================================================
    // FIRMA DEL CLIENTE
    // ========================================================
    const evFirma = evidencias.find(e => e.firmaClienteUrl);

    if (evFirma) {
      doc.addPage();
      dibujarMarcaAgua(doc, watermark);

      doc.fontSize(18).fillColor("#004b85").text("Firma del Cliente", { underline: true });
      doc.moveDown(1);

      const firma = await procesarImagen(evFirma.firmaClienteUrl, 320, 180);

      if (firma) {
        const x = (doc.page.width - 320) / 2;
        doc.image(firma, x, doc.y);
      }
    }

    // ========================================================
    // MATERIALES
    // ========================================================
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      doc.addPage();
      dibujarMarcaAgua(doc, watermark);

      doc.fontSize(18).fillColor("#004b85").text("Material Ocupado", { underline: true });
      doc.moveDown(1);

      const grupos = {};

      materiales.forEach(m => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      for (const c of Object.keys(grupos)) {
        doc.fontSize(14).fillColor("#004b85").text(`• ${c}`);
        grupos[c].forEach(m => {
          doc.fontSize(12).fillColor("black").text(
            `${m.insumo}: ${m.cantidad} ${m.unidad}`,
            { indent: 25 }
          );
        });

        doc.moveDown(1);
      }
    }

    // ============================================
    // FINALIZAR PDF
    // ============================================
    doc.end();

  } catch (err) {
    console.error("ERROR REPORTE PDF:", err);
    res.status(500).json({ error: "Error al generar PDF" });
  }
};
