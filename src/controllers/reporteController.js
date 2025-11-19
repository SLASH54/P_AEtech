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


// ==============================
//  Rutas correctas para Render
// ==============================
const publicDir = path.join(process.cwd(), "public");
const logoPath = path.join(publicDir, "logo.png");
const watermarkPath = path.join(publicDir, "watermark.png");


// ==============================
//   Marca de agua
// ==============================
function drawWatermark(doc) {
  if (!fs.existsSync(watermarkPath)) return;

  try {
    const wm = doc.openImage(watermarkPath);
    const scale = 0.40;

    const w = wm.width * scale;
    const h = wm.height * scale;

    const x = (doc.page.width - w) / 2;
    const y = (doc.page.height - h) / 2;

    doc.save()
      .opacity(0.15)
      .image(wm, x, y, { width: w })
      .opacity(1)
      .restore();

  } catch (err) {
    console.log("⚠ Error en watermark:", err.message);
  }
}


// ==============================
//   Encabezado con logo
// ==============================
function drawHeader(doc) {
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 40, 25, { width: 80 });
    } catch { }
  }

  doc.fontSize(20).fillColor("#003366").text("AE TECH", 140, 30);
  doc.fontSize(11).fillColor("#666").text("Reporte oficial de servicio", 140, 55);

  doc.moveTo(40, 90)
    .lineTo(550, 90)
    .stroke("#003366");

  doc.moveDown(2);
}


// ==============================
//   Procesar imágenes de Cloudinary
// ==============================
async function procesarImagen(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate()
      .resize({
        width: 400,   // más pequeño
        height: 450,
        fit: "inside"
      })
      .jpeg({ quality: 80 })
      .toBuffer();

  } catch (err) {
    console.log("⚠ Error procesando imagen:", err.message);
    return null;
  }
}



// =================================================
//   CONTROLADOR PRINCIPAL
// =================================================
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

    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

    if (!tarea.Evidencia?.length)
      return res.status(400).json({ error: "La tarea no tiene evidencias" });


    // =========================
    //   Configurar PDF
    // =========================
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


    // Primera página
    drawWatermark(doc);
    drawHeader(doc);

    doc.on("pageAdded", () => {
      drawWatermark(doc);
      drawHeader(doc);
    });


    // =========================
    //   Detalles de la tarea
    // =========================
    doc.fontSize(18).fillColor("#003366").text("Trabajo Realizado");
    doc.moveDown(0.5);
    doc.fontSize(13).fillColor("black").text(tarea.nombre);
    doc.moveDown(1);

    doc.fontSize(18).fillColor("#003366").text("Detalles del servicio");
    doc.moveDown(0.7);

    doc.fontSize(12).fillColor("black");
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección Sucursal: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
    doc.text(`Fecha finalización: ${tarea.fechaLimite}`);

    doc.moveDown(1.5);



    // =========================
    //   SECCIÓN EVIDENCIAS
    // =========================
    doc.addPage();
    doc.fontSize(20).fillColor("#003366").text("Evidencias", { underline: true });
    doc.moveDown(1);

    for (const ev of tarea.Evidencia) {

      doc.fontSize(13).fillColor("black").text(`• ${ev.titulo}`);
      doc.moveDown(0.4);

      const buffer = await procesarImagen(ev.archivoUrl);

      if (!buffer) {
        doc.fillColor("red").text("(Imagen no disponible)");
        doc.moveDown(1);
        continue;
      }

      const img = doc.openImage(buffer);

      if (doc.y + img.height > doc.page.height - 80) {
        doc.addPage();
      }

      const x = (doc.page.width - img.width) / 2;

      doc.image(buffer, x, doc.y, { width: img.width });
      doc.moveDown(1.2);
    }



    // =========================
    //   SECCIÓN FIRMA DEL CLIENTE
    // =========================
    const evidenciaConFirma = tarea.Evidencia.find(e => e.firmaClienteUrl);

    if (evidenciaConFirma) {
      doc.addPage();
      doc.fontSize(20).fillColor("#003366").text("Firma del Cliente", { underline: true });
      doc.moveDown(1);

      const buffer = await procesarImagen(evidenciaConFirma.firmaClienteUrl);

      if (buffer) {
        const img = doc.openImage(buffer);
        const x = (doc.page.width - img.width) / 2;

        doc.image(buffer, x, doc.y, { width: img.width });
      } else {
        doc.fillColor("red").text("No se pudo cargar la firma.");
      }
    }



    // =========================
    //   SECCIÓN MATERIALES
    // =========================
    const materiales = tarea.Evidencia[0].materiales || [];

    if (materiales.length > 0) {
      doc.addPage();

      doc.fontSize(20).fillColor("#003366").text("Material Ocupado", { underline: true });
      doc.moveDown(1);

      const grupos = {};

      materiales.forEach(m => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      for (const categoria of Object.keys(grupos).sort()) {
        doc.fontSize(15).fillColor("#003366").text(`• ${categoria}`);
        doc.moveDown(0.3);

        grupos[categoria].forEach(mat => {
          doc.fontSize(12).fillColor("black").text(
            `${mat.insumo} — ${mat.cantidad} ${mat.unidad}`,
            { indent: 20 }
          );
        });

        doc.moveDown(0.8);
      }
    }


    // Final
    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
