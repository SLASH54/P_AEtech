// ===============================================================
//   REPORTE PDF AETECH – FOOTER PERFECTO EN TODAS LAS PÁGINAS
// ===============================================================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const {
  Tarea,
  Actividad,
  Sucursal,
  ClienteNegocio,
  Usuario,
  Evidencia
} = require("../models/relations");

// =========================================================
//   Cargar imagen
// =========================================================
async function cargarImagen(urlOrPath) {
  try {
    if (urlOrPath.startsWith("http")) {
      const res = await axios.get(urlOrPath, { responseType: "arraybuffer" });
      return res.data;
    } else {
      return fs.readFileSync(urlOrPath);
    }
  } catch (err) {
    console.log("⚠ Error cargando imagen:", urlOrPath, err.message);
    return null;
  }
}

// =========================================================
//   Procesar imagen
// =========================================================
async function procesarImagen(url, maxW, maxH, isSignature = false) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    let pipeline = sharp(res.data).rotate();

    if (isSignature) pipeline = pipeline.png();
    else pipeline = pipeline.jpeg({ quality: 90 });

    return await pipeline
      .resize({ width: maxW, height: maxH, fit: "inside" })
      .toBuffer();
  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// =========================================================
//   Marca de agua grande
// =========================================================
function aplicarMarcaAgua(doc, watermarkBuf) {
  try {
    const wm = doc.openImage(watermarkBuf);
    doc.save();
    doc.opacity(0.25);
    const w = 600;
    const x = (doc.page.width - w) / 2;
    const y = 140;
    doc.image(wm, x, y, { width: w });
    doc.opacity(1);
    doc.restore();
  } catch (err) {
    console.log("⚠ Error pintando marca de agua:", err.message);
  }
}

// =========================================================
//   Encabezado automático
// =========================================================
function encabezado(doc, logoBuf, watermarkBuf) {
  aplicarMarcaAgua(doc, watermarkBuf);

  if (logoBuf) {
    const logo = doc.openImage(logoBuf);
    doc.image(logo, 40, 25, { width: 110 });
  }

  doc.fontSize(28).fillColor("#004b85").text("AE TECH", 170, 30);
  doc.fontSize(12).fillColor("#444").text("Reporte oficial de servicio", 170, 63);

  doc.moveTo(40, 90).lineTo(doc.page.width - 40, 90).stroke("#CCCCCC");
  doc.moveDown(2);
}

// =========================================================
//   GENERAR REPORTE PDF – VERSIÓN FINAL SIN PÁGINAS EN BLANCO
// =========================================================
exports.generateReportePDF = async (req, res) => {
  const { tareaId } = req.params;

  try {
    const tarea = await Tarea.findOne({
      where: { id: tareaId },
      include: [ Actividad, Sucursal, ClienteNegocio, { model: Usuario, as: "AsignadoA" }, Evidencia ]
    });

    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

    const evidencias = tarea.Evidencia || [];

    const logoURL = "https://p-aetech.onrender.com/public/logo.png";
    const watermarkURL = "https://p-aetech.onrender.com/public/watermark.png";

    const logoBuf = await cargarImagen(logoURL);
    const watermarkBuf = await cargarImagen(watermarkURL);

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Reporte_Tarea_${tareaId}.pdf`);
    doc.pipe(res);

    // =============================================================
    //  FOOTER + ENCABEZADO AUTOMÁTICOS EN CADA PÁGINA
    // =============================================================
    doc.on("pageAdded", () => {
      encabezado(doc, logoBuf, watermarkBuf);

      // Footer abajo real
      doc.fontSize(10).fillColor("#555");
      doc.text(
        `AE TECH · Reporte oficial · Página ${doc.page.number}`,
        40,
        doc.page.height - 40,
        { width: doc.page.width - 80, align: "center" }
      );
    });

    // =============================================================
    //  PRIMERA PÁGINA
    // =============================================================
    encabezado(doc, logoBuf, watermarkBuf);

    doc.fontSize(20).fillColor("#004b85").text("Información del servicio");
    doc.moveDown(1);

    doc.fontSize(13).fillColor("#000");
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección de Sucursal: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre}`);
    doc.text(`Fecha límite: ${tarea.fechaLimite}`);

    // =============================================================
    //  EVIDENCIAS
    // =============================================================
    doc.addPage();

    doc.fontSize(20).fillColor("#004b85").text("Evidencias");
    doc.moveDown(1);

    const MAX_W = 260, MAX_H = 260, GAP = 40;
    let col = 0;
    let y = doc.y;

    for (const ev of evidencias) {
      const imgBuffer = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);
      if (!imgBuffer) continue;

      const img = doc.openImage(imgBuffer);
      const x = col === 0 ? 60 : doc.page.width / 2 + 10;

      if (y + img.height > doc.page.height - 150) {
        doc.addPage();
        y = 130;
      }

      doc.image(imgBuffer, x, y, { width: img.width });
      doc.fontSize(12).text(ev.titulo || "Evidencia", x, y + img.height + 5);

      if (col === 0) col = 1;
      else { col = 0; y += img.height + GAP; }
    }

    // =============================================================
    //  FIRMA DEL CLIENTE
    // =============================================================
    const evFirma = evidencias.find(e => e.firmaClienteUrl);

    if (evFirma) {
      doc.addPage();

      doc.fontSize(20).fillColor("#004b85").text("Firma del Cliente");
      doc.moveDown(1);

      const firmaBuf = await procesarImagen(evFirma.firmaClienteUrl, 380, 220, true);

      if (firmaBuf) {
        const img = doc.openImage(firmaBuf);
        const x = (doc.page.width - img.width) / 2;
        doc.image(firmaBuf, x, doc.y);
      } else {
        doc.fillColor("red").text("⚠ No se pudo cargar la firma.");
      }
    }

    // =============================================================
    //  MATERIALES
    // =============================================================
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      doc.addPage();

      doc.fontSize(20).fillColor("#004b85").text("Material Ocupado");
      doc.moveDown(1);

      const grupos = {};
      materiales.forEach(m => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      for (const cat of Object.keys(grupos)) {
        doc.fontSize(16).fillColor("#004b")

        doc.moveDown(1);
      }
    }

    // =============================================================
    //  CIERRE DEL DOCUMENTO
    // =============================================================

    doc.end();
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    return res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};