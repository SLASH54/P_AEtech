// ======================================
//   REPORTE PDF AETECH - VERSION FINAL
// ======================================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const {
  Tarea,
  Actividad,
  Sucursal,
  ClienteNegocio,
  Usuario,
  Evidencia,
} = require("../models");

// ======================================================
//   RUTA CORRECTA PARA RENDER — public está en root/
// ======================================================
const publicDir = path.join(process.cwd(), "public");
const logoPath = path.join(publicDir, "logo.png");
const watermarkPath = path.join(publicDir, "watermark.png");

// ======================================================
//   UTIL: Marca de agua centrada (funciona en todas)
// ======================================================
function drawWatermark(doc) {
  if (!fs.existsSync(watermarkPath)) return;

  try {
    const wm = doc.openImage(watermarkPath);
    const scale = 0.45; // tamaño perfecto
    const w = wm.width * scale;
    const h = wm.height * scale;

    const x = (doc.page.width - w) / 2;
    const y = (doc.page.height - h) / 2;

    doc.save()
      .opacity(0.12)
      .image(wm, x, y, { width: w })
      .opacity(1)
      .restore();
  } catch (err) {
    console.log("⚠ Error dibujando watermark:", err.message);
  }
}

// ======================================================
//   UTIL: Encabezado con logo
// ======================================================
function drawHeader(doc) {
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 40, 25, { width: 80 });
    } catch (err) {
      console.log("⚠ Error dibujando logo:", err.message);
    }
  }

  doc.fontSize(20).fillColor("#003366").text("AE TECH", 140, 30);
  doc.fontSize(11).fillColor("#777").text("Reporte oficial de servicio", 140, 55);

  doc.moveTo(40, 90)
    .lineTo(550, 90)
    .stroke("#003366");

  doc.moveDown(2);
}

// ======================================================
//   UTIL: Procesar y comprimir imágenes Cloudinary
// ======================================================
async function procesarImagen(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate()
      .resize({
        width: 480,        // tamaño óptimo para carta
        height: 580,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// ======================================================
//   UTIL: Dibujar evidencias SIN amontonarse
// ======================================================
async function drawImages(doc, evidencias) {
  for (const ev of evidencias) {
    doc.fontSize(14).fillColor("#003366").text(`• ${ev.titulo}`);
    doc.moveDown(0.5);

    const imgBuffer = await procesarImagen(ev.archivoUrl);

    if (!imgBuffer) {
      doc.fillColor("red").text("No se pudo cargar la imagen.");
      doc.moveDown(1);
      continue;
    }

    const img = doc.openImage(imgBuffer);

    // salto de página limpio si no cabe
    if (doc.y + img.height > doc.page.height - 80) {
      doc.addPage();
      drawWatermark(doc);
      drawHeader(doc);
    }

    // centrar imagen
    const x = (doc.page.width - img.width) / 2;

    doc.image(img, x, doc.y);
    doc.moveDown(1.5);
  }
}

// ======================================================
//   CONTROLADOR PRINCIPAL
// ======================================================
exports.generateReportePDF = async (req, res) => {
  try {
    const { tareaId } = req.params;

    const tarea = await Tarea.findOne({
      where: { id: tareaId },
      include: [
        { model: Actividad },
        { model: Sucursal },
        { model: ClienteNegocio },
        { model: Usuario, as: "AsignadoA" },
        { model: Evidencia },
      ],
    });

    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    if (!tarea.Evidencia || tarea.Evidencia.length === 0) {
      return res.status(400).json({ error: "La tarea no tiene evidencias" });
    }

    // =============================================
    //    CONFIGURAR PDF
    // =============================================
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Reporte_Tarea_${tareaId}.pdf"`
    );

    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40,
      compress: true,
    });

    doc.pipe(res);

    // aplicar en primera página
    drawWatermark(doc);
    drawHeader(doc);

    // repetir en nuevas páginas
    doc.on("pageAdded", () => {
      drawWatermark(doc);
      drawHeader(doc);
    });

    // =============================================
    //      DETALLES DE LA TAREA
    // =============================================
    doc.fontSize(18).fillColor("#003366").text("Trabajo Realizado");
    doc.moveDown(0.4);
    doc.fontSize(13).fillColor("black").text(tarea.nombre);
    doc.moveDown(1);

    doc.fontSize(18).fillColor("#003366").text("Detalles del servicio");
    doc.moveDown(0.6);

    doc.fontSize(12).fillColor("black");
    doc.text(`Cliente: ${tarea.ClienteNegocio?.nombre}`);
    doc.text(`Dirección Cliente: ${tarea.ClienteNegocio?.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal?.nombre}`);
    doc.text(`Dirección Sucursal: ${tarea.Sucursal?.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad?.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA?.nombre} (${tarea.AsignadoA?.rol})`);
    doc.text(`Fecha finalización: ${tarea.fechaLimite}`);

    doc.moveDown(1.2);

    // =============================================
    //      EVIDENCIAS
    // =============================================
    doc.fontSize(18).fillColor("#003366").text("Evidencias");
    doc.moveDown(0.8);

    await drawImages(doc, tarea.Evidencia);

    // =============================================
    // FIN DEL REPORTE
    // =============================================
    doc.end();
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
