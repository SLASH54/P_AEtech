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


// ===========================================================
//    Cargar imagen desde URL pública o desde ruta local
// ===========================================================
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
// ===========================================================
//  Aplicar marca de agua en cada página
// ===========================================================
function aplicarMarcaAgua(doc, watermarkBuf) {
  try {
    const wm = doc.openImage(watermarkBuf);

    doc.save();
    doc.opacity(0.08);

    const w = 420;
    const x = (doc.page.width - w) / 2;
    const y = 180;

    doc.image(wm, x, y, { width: w });

    doc.opacity(1);
    doc.restore();
  } catch (err) {
    console.log("⚠ Error pintando marca de agua:", err.message);
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

    // =====================================
    //   ARCHIVOS ESTÁTICOS (LOGO Y WATERMARK)
    // =====================================
    const logoURL = "https://p-aetech.onrender.com/public/logo.png";
    const watermarkURL = "https://p-aetech.onrender.com/public/watermark.png";

    const logoBuf = await cargarImagen(logoURL);
    const watermarkBuf = await cargarImagen(watermarkURL);

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
    aplicarMarcaAgua(doc, watermarkBuf);

    if (logoBuf) {
      const logo = doc.openImage(logoBuf);
      doc.image(logo, 40, 20, { width: 110 });
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
    aplicarMarcaAgua(doc, watermarkBuf);
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
        aplicarMarcaAgua(doc, watermarkBuf);
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
      aplicarMarcaAgua(doc, watermarkBuf);

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

