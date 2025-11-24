// ==============================
//   REPORTE PDF AETECH (FINAL)
// ==============================

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

// -----------------------------------------------------------
// UTIL: Procesar imagen (fotos de evidencia)
// -----------------------------------------------------------
async function procesarImagen(url, maxW, maxH) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate()
      .resize({
        width: maxW,
        height: maxH,
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({ quality: 92 })
      .toBuffer();

  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// -----------------------------------------------------------
// UTIL: Marca de agua (PNG sin procesar)
// -----------------------------------------------------------
function aplicarMarcaAgua(doc, watermarkPath) {
  if (!fs.existsSync(watermarkPath)) return;

  try {
    const img = doc.openImage(watermarkPath);

    doc.save();
    doc.opacity(0.10);
    doc.image(watermarkPath, 90, 180, { width: 380 });
    doc.opacity(1);
    doc.restore();

  } catch (err) {
    console.log("⚠ Error watermark:", err.message);
  }
}

// -----------------------------------------------------------
//   GENERAR REPORTE PDF (FINAL)
// -----------------------------------------------------------
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

    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

    const evidencias = tarea.Evidencia || [];

    // ---------------------------------------------
    //   CREACIÓN DEL PDF
    // ---------------------------------------------
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Reporte_Tarea_${tareaId}.pdf`);
    doc.pipe(res);

    const logoPath = path.join(__dirname, "../public/logo.png");
    const watermarkPath = path.join(__dirname, "../public/watermark.png");

    // ======================================================
    //  PÁGINA 1 – ENCABEZADO + INFORMACIÓN
    // ======================================================
    aplicarMarcaAgua(doc, watermarkPath);

    // LOGO
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 20, { width: 110 });
    }

    doc.image(".../public/logo.png", 40, 20, { width: 110 });
    doc.fontSize(26).fillColor("#004b85").text("AE TECH", 170, 30);
    doc.fontSize(12).fillColor("#666").text("Reporte oficial de servicio", 170, 60);

    doc.moveDown(2);

    doc.fontSize(20).fillColor("#004b85").text("Información del servicio", {
      underline: true
    });

    doc.moveDown(1);

    doc.fontSize(12).fillColor("#000");
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección de la Sucursal: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
    doc.text(`Fecha de finalización: ${tarea.fechaLimite}`);

    // ======================================================
    //  PÁGINA 2 → EVIDENCIAS (2 por página, centradas)
    // ======================================================
    doc.addPage();
    aplicarMarcaAgua(doc, watermarkPath);

    doc.fontSize(20).fillColor("#004b85").text("Evidencias", { underline: true });
    doc.moveDown(1);

    const MAX_W = 260;
    const MAX_H = 260;
    const GAP = 45;

    let col = 0;
    let y = doc.y;

    for (const ev of evidencias) {
      const imgBuffer = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);

      if (!imgBuffer) continue;

      const img = doc.openImage(imgBuffer);
      const x = col === 0 ? 70 : doc.page.width / 2 + 10;

      // Salto de página
      if (y + img.height > doc.page.height - 80) {
        doc.addPage();
        aplicarMarcaAgua(doc, watermarkPath);
        y = 80;
      }

      doc.image(imgBuffer, x, y);

      doc.fontSize(12)
        .fillColor("#000")
        .text(ev.titulo || "Evidencia", x, y + img.height + 5);

      if (col === 0) {
        col = 1;
      } else {
        col = 0;
        y += img.height + GAP;
      }
    }

    // ======================================================
    //   PÁGINA – FIRMA DEL CLIENTE (PNG ORIGINAL)
    // ======================================================
    const evFirma = evidencias.find((e) => e.firmaClienteUrl);

    if (evFirma) {
      doc.addPage();
      aplicarMarcaAgua(doc, watermarkPath);

      doc.fontSize(20)
        .fillColor("#004b85")
        .text("Firma del Cliente", { underline: true });

      doc.moveDown(1);

      try {
        const resFirma = await axios.get(evFirma.firmaClienteUrl, {
          responseType: "arraybuffer"
        });

        const firmaPNG = resFirma.data; // SIN procesar
        const imgFirma = doc.openImage(firmaPNG);

        const x = (doc.page.width - imgFirma.width) / 2;

        doc.image(firmaPNG, x, doc.y, {
          fit: [400, 200],
          align: "center"
        });

      } catch (err) {
        console.log("⚠ Error cargando firma:", err.message);
        doc.fillColor("red").text("⚠ No se pudo cargar la firma.");
      }
    }

    // ======================================================
    //   PÁGINA – MATERIALES
    // ======================================================
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      doc.addPage();
      aplicarMarcaAgua(doc, watermarkPath);

      doc
        .fontSize(20)
        .fillColor("#004b85")
        .text("Material Ocupado", { underline: true });

      doc.moveDown(1);

      const grupos = {};

      materiales.forEach((m) => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      for (const cat of Object.keys(grupos)) {
        doc.fontSize(16).fillColor("#004b85").text(`• ${cat}`);
        doc.moveDown(0.3);

        grupos[cat].forEach((m) => {
          doc
            .fontSize(12)
            .fillColor("#000")
            .text(`${m.insumo} — ${m.cantidad} ${m.unidad}`, { indent: 20 });
        });

        doc.moveDown(1);
      }
    }

    // FINALIZAR PDF
    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    return res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
