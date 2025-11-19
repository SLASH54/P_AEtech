// ==============================
//       REPORTE PDF AETECH
// ==============================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { Tarea, Actividad, Sucursal, ClienteNegocio, Usuario, Evidencia } = require("../models/relations");

// -------------------------------------------
//   UTIL: Comprimir cualquier imagen grande
// -------------------------------------------

async function procesarImagen(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate() // corrige orientación EXIF
      .resize({
        width: 550,
        height: 650,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 70 }) // compresión agresiva para evitar cuelgues
      .toBuffer();
  } catch (err) {
    console.error("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// -------------------------------------------
//   UTIL: Dibujar marca de agua centrada
// -------------------------------------------

function dibujarMarcaAgua(doc, watermarkPath) {
  try {
    if (!fs.existsSync(watermarkPath)) return;

    const wm = doc.openImage(watermarkPath);
    const scale = 0.55;

    const wmWidth = wm.width * scale;
    const wmHeight = wm.height * scale;

    const x = (doc.page.width - wmWidth) / 2;
    const y = (doc.page.height - wmHeight) / 2;

    doc.save()
      .opacity(0.15)
      .image(wm, x, y, { width: wmWidth })
      .opacity(1)
      .restore();
  } catch (err) {
    console.error("⚠ Error dibujando marca de agua:", err.message);
  }
}

// -------------------------------------------
//   UTIL: Dibujar imágenes sin romper PDF
// -------------------------------------------

async function dibujarEvidencias(doc, evidencias) {
  for (const ev of evidencias) {

    doc.fontSize(13).fillColor("#003366").text(`• ${ev.titulo || "Evidencia"}`);
    doc.moveDown(0.5);

    try {
      const buffer = await procesarImagen(ev.archivoUrl);

      if (!buffer) {
        doc.fillColor("red").text("(No se pudo cargar la imagen)");
        continue;
      }

      const img = doc.openImage(buffer);

      // Saltar de página si no cabe
      if (doc.y + img.height > doc.page.height - 80) {
        doc.addPage();
        // agregar marca de agua también aquí
        const watermarkPath = path.join(__dirname, "../public/watermark.png");
        dibujarMarcaAgua(doc, watermarkPath);
      }

      const x = (doc.page.width - img.width) / 2;
      doc.image(buffer, x, doc.y);

      doc.moveDown(1.5);

    } catch (err) {
      console.error("⚠ Error insertando evidencia:", err.message);
      doc.text("(Error al insertar imagen)");
      doc.moveDown(1);
    }
  }
}

// -------------------------------------------
//          CONTROLADOR GENERAR PDF
// -------------------------------------------

exports.generateReportePDF = async (req, res) => {
  try {
    const tareaId = req.params.tareaId;

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

    // ----------------------------------
    //      CONFIGURAR PDF
    // ----------------------------------

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

    const logoPath = path.join(__dirname, "../public/logo.png");
    const watermarkPath = path.join(__dirname, "../public/watermark.png");

    // Marca de agua en primera página
    dibujarMarcaAgua(doc, watermarkPath);

    // ----------------------------------
    //           ENCABEZADO
    // ----------------------------------

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 90 });
    }

    doc.fontSize(22).fillColor("#003366").text("AE TECH", 150, 35);
    doc.fontSize(12).text("Reporte oficial de servicio", 150, 60);

    doc.moveDown(2);
    doc
      .strokeColor("#003366")
      .lineWidth(1)
      .moveTo(30, doc.y)
      .lineTo(580, doc.y)
      .stroke();
    doc.moveDown(1.5);

    // ----------------------------------
    //        DETALLES DE LA TAREA
    // ----------------------------------

    doc.fontSize(18).fillColor("#003366").text("Trabajo Realizado:");
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor("black").text(tarea.nombre);
    doc.moveDown(1);

    doc.fontSize(18).fillColor("#003366").text("Detalles del servicio");
    doc.moveDown(0.8);

    doc.fontSize(12).fillColor("black");
    doc.text(`Cliente: ${tarea.ClienteNegocio?.nombre}`);
    doc.text(`Dirección: ${tarea.ClienteNegocio?.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal?.nombre}`);
    doc.text(`Dirección de la Sucursal: ${tarea.Sucursal?.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad?.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA?.nombre}`);
    doc.text(`Fecha de finalización: ${tarea.fechaLimite}`);

    doc.moveDown(1.2);

    doc
      .strokeColor("#003366")
      .lineWidth(1)
      .moveTo(30, doc.y)
      .lineTo(580, doc.y)
      .stroke();

    doc.moveDown(1.5);

    // ----------------------------------
    //       EVIDENCIAS
    // ----------------------------------

    doc.fontSize(18).fillColor("#003366").text("Evidencias Recopiladas");
    doc.moveDown(1);

    await dibujarEvidencias(doc, tarea.Evidencia);

    // ----------------------------------
    //         FIN DEL PDF
    // ----------------------------------

    doc.end();
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
