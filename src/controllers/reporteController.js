// ===============================================
//   REPORTE PDF AETECH (VERSIÓN FINAL)
//   Logo + Marca agua + Firma + Evidencias 2xPágina
// ===============================================

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

// ===========================================================
//  UTILERÍAS PARA IMÁGENES (NO PIXELEADAS)
// ===========================================================
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

// ===========================================================
//  LOGO & MARCA AGUA
// ===========================================================
const logoPath = path.join(__dirname, "../public/logo.png");
const watermarkPath = path.join(__dirname, "../public/watermark.png");

function aplicarMarcaAgua(doc) {
  if (!fs.existsSync(watermarkPath)) return;

  try {
    const wm = doc.openImage(watermarkPath);
    const scaleW = 420;
    const x = (doc.page.width - scaleW) / 2;
    const y = 180;

    doc.save();
    doc.opacity(0.08);
    doc.image(watermarkPath, x, y, { width: scaleW });
    doc.opacity(1);
    doc.restore();
  } catch (err) {
    console.log("⚠ Error marca de agua:", err.message);
  }
}

function encabezado(doc) {
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 20, { width: 90 });
  }

  doc.fontSize(22).fillColor("#004b85").text("AE TECH", 150, 28);
  doc.fontSize(10).fillColor("#666").text("Reporte oficial de servicio", 150, 55);

  doc.moveTo(40, 80).lineTo(doc.page.width - 40, 80).stroke("#004b85");

  doc.moveDown(2);
}

// ===========================================================
//        GENERAR REPORTE PDF
// ===========================================================
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

    // ============================
    // CREAR PDF
    // ============================
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Reporte_Tarea_${tareaId}.pdf`
    );

    doc.pipe(res);

    // ============================
    //  PÁGINA 1 - ENCABEZADO
    // ============================
    encabezado(doc);
    aplicarMarcaAgua(doc);

    doc.fontSize(20).fillColor("#004b85").text("Información del servicio", {
      underline: true
    });
    doc.moveDown(1);

    doc.fontSize(12).fillColor("#000");
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección Sucursal: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
    doc.text(`Fecha de finalización: ${tarea.fechaLimite}`);

    // ============================
    //  PÁGINA 2 - EVIDENCIAS (2 POR PÁGINA)
    // ============================
    doc.addPage();
    encabezado(doc);
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
      const x = col === 0 ? 80 : doc.page.width / 2 + 10;

      // Nueva página si no cabe
      if (y + img.height > doc.page.height - 120) {
        doc.addPage();
        encabezado(doc);
        aplicarMarcaAgua(doc);
        y = 100;
      }

      doc.image(imgBuffer, x, y, { width: img.width });
      doc.fontSize(12).fillColor("#000").text(ev.titulo, x, y + img.height + 5);

      if (col === 0) col = 1;
      else {
        col = 0;
        y += img.height + GAP;
      }
    }

    // ============================
    //  PÁGINA 3 - FIRMA DEL CLIENTE
    // ============================
    const evidenciaFirma = evidencias.find((e) => e.firmaClienteUrl);

    if (evidenciaFirma) {
      doc.addPage();
      encabezado(doc);
      aplicarMarcaAgua(doc);

      doc.fontSize(20).fillColor("#004b85").text("Firma del Cliente", {
        underline: true
      });
      doc.moveDown(1);

      const firmaBuf = await procesarImagen(
        evidenciaFirma.firmaClienteUrl,
        380,
        200
      );

      if (firmaBuf) {
        const img = doc.openImage(firmaBuf);
        const x = (doc.page.width - img.width) / 2;
        doc.image(firmaBuf, x, doc.y);
      } else {
        doc.fillColor("red").text("⚠ No se pudo cargar la firma.");
      }
    }

    // ============================
    //  PÁGINA 4 - MATERIALES
    // ============================
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      doc.addPage();
      encabezado(doc);
      aplicarMarcaAgua(doc);

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

      Object.keys(grupos).forEach((cat) => {
        doc.fontSize(16).fillColor("#004b85").text(`• ${cat}`);
        doc.moveDown(0.3);

        grupos[cat].forEach((m) => {
          doc
            .fontSize(12)
            .fillColor("#000")
            .text(`${m.insumo} — ${m.cantidad} ${m.unidad}`, { indent: 20 });
        });

        doc.moveDown(1);
      });
    }

    doc.end();
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    return res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
