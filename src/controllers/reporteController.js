// ===============================================================
//   REPORTE PDF AETECH – VERSIÓN FINAL ESTABLE
// ===============================================================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const {
  Tarea,
  Actividad,
  Sucursal,
  ClienteNegocio,
  Usuario,
  Evidencia
} = require("../models/relations");

// =========================================================
//   PROCESAR IMAGEN (Sharp) – evita fondo negro en firmas
// =========================================================
async function procesarImagen(url, maxW, maxH, isSignature = false) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    let pipeline = sharp(res.data).rotate();

    // Firma → NO convertir a JPEG (produce fondo negro)
    if (isSignature) {
      pipeline = pipeline.png();
    } else {
      pipeline = pipeline.jpeg({ quality: 90 });
    }

    return await pipeline
      .resize({
        width: maxW,
        height: maxH,
        fit: "inside",
        withoutEnlargement: true
      })
      .toBuffer();

  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// =========================================================
//   MARCA DE AGUA
// =========================================================
function aplicarMarcaAgua(doc) {
  const watermarkPath = path.join(__dirname, "../public/watermark.png");

  if (!fs.existsSync(watermarkPath)) return;

  try {
    const width = 360;
    const x = (doc.page.width - width) / 2;
    const y = (doc.page.height - width) / 2;

    doc.save();
    doc.opacity(0.08);
    doc.image(watermarkPath, x, y, { width });
    doc.opacity(1);
    doc.restore();

  } catch (err) {
    console.log("⚠ Error mostrando marca de agua:", err.message);
  }
}


// =========================================================
//   GENERAR REPORTE PDF – FINAL
// =========================================================
exports.generateReportePDF = async (req, res) => {
  const { tareaId } = req.params;

  try {
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

    if (!tarea)
      return res.status(404).json({ error: "Tarea no encontrada" });

    const evidencias = tarea.Evidencia || [];

    // ========================================
    // Inicializa PDF
    // ========================================
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition",
      `attachment; filename=Reporte_Tarea_${tareaId}.pdf`);
    doc.pipe(res);

    // ========================================
    // LOGO
    // ========================================
    const logoPath = path.join(__dirname, "../public/logo.png");

    aplicarMarcaAgua(doc);

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 25, { width: 110 });
    }

    doc.fontSize(28).fillColor("#004b85").text("AE TECH", 170, 30);
    doc.fontSize(12).fillColor("#444").text("Reporte oficial de servicio", 170, 63);

    doc.moveDown(2);

    // ========================================
    // INFORMACIÓN GENERAL
    // ========================================
    doc.fontSize(20).fillColor("#004b85")
      .text("Información del servicio", { underline: true });

    doc.moveDown(1);

    doc.fontSize(13).fillColor("#000");
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección de Sucursal: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre}`);
    doc.text(`Fecha límite: ${tarea.fechaLimite}`);

    // ========================================
    //    PÁGINA DE EVIDENCIAS
    // ========================================
    doc.addPage();
    aplicarMarcaAgua(doc);
    doc.fontSize(20).fillColor("#004b85").text("Evidencias", { underline: true });

    doc.moveDown(1);

    const MAX_W = 260;
    const MAX_H = 260;
    const GAP = 40;

    let col = 0;
    let y = doc.y;

    for (const ev of evidencias) {
      const imgBuffer = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);

      if (!imgBuffer) continue;

      const img = doc.openImage(imgBuffer);
      const x = col === 0 ? 60 : doc.page.width / 2 + 10;

      if (y + img.height > doc.page.height - 80) {
        doc.addPage();
        aplicarMarcaAgua(doc);
        y = 80;
      }

      doc.image(imgBuffer, x, y, { width: img.width });

      doc.fontSize(12).text(ev.titulo || "Evidencia", x, y + img.height + 5);

      if (col === 0) {
        col = 1;
      } else {
        col = 0;
        y += img.height + GAP;
      }
    }

    // ========================================
    //    FIRMA DEL CLIENTE
    // ========================================
    const evFirma = evidencias.find(e => e.firmaClienteUrl);

    if (evFirma) {
      doc.addPage();
      aplicarMarcaAgua(doc);

      doc.fontSize(20).fillColor("#004b85")
        .text("Firma del Cliente", { underline: true });

      doc.moveDown(1);

      const firmaBuf = await procesarImagen(
        evFirma.firmaClienteUrl,
        380,
        220,
        true // 🔥 firma = PNG → evita fondo negro
      );

      if (firmaBuf) {
        const img = doc.openImage(firmaBuf);
        const x = (doc.page.width - img.width) / 2;
        doc.image(firmaBuf, x, doc.y);
      } else {
        doc.fillColor("red").text("⚠ No se pudo cargar la firma.");
      }
    }

    // ========================================
    //   TABLA DE MATERIALES
    // ========================================
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      doc.addPage();
      aplicarMarcaAgua(doc);

      doc.fontSize(20).fillColor("#004b85")
        .text("Material Ocupado", { underline: true });

      doc.moveDown(1);

      const grupos = {};

      materiales.forEach(m => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      for (const cat of Object.keys(grupos)) {
        doc.fontSize(16).fillColor("#004b85").text(`• ${cat}`);
        doc.moveDown(0.3);

        grupos[cat].forEach(m => {
          doc.fontSize(12).fillColor("#000")
            .text(`${m.insumo} — ${m.cantidad} ${m.unidad}`, { indent: 20 });
        });

        doc.moveDown(1);
      }
    }

    // FINALIZA PDF
    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    return res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};

