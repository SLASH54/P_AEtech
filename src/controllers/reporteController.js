// ==============================
//   REPORTE PDF AETECH (FINAL PROFESIONAL)
//   Con encabezado corporativo, marca de agua, firma PNG,
//   evidencias centradas (2 por página) y materiales ordenados.
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
// UTIL: Procesar imagen sin pixelar
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
// UTIL: Marca de agua
// -----------------------------------------------------------
function cargarMarcaAgua() {
  const p = path.join(__dirname, "../public/watermark.png");
  if (!fs.existsSync(p)) return null;
  return p;
}

function aplicarMarcaAgua(doc, wmPath) {
  if (!wmPath) return;

  try {
    const scaleW = 420;
    const x = (doc.page.width - scaleW) / 2;
    const y = 180;

    doc.save();
    doc.opacity(0.10);
    doc.image(wmPath, x, y, { width: scaleW });
    doc.opacity(1);
    doc.restore();
  } catch (err) {
    console.log("⚠ No se pudo aplicar la marca de agua:", err.message);
  }
}

// -----------------------------------------------------------
// ENCABEZADO PROFESIONAL AE TECH
// -----------------------------------------------------------
function headerAETech(doc) {
  const logoPath = path.join(__dirname, "../public/logo.png");

  // Logo
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 20, { width: 80 });
  }

  // Título
  doc.fontSize(26).fillColor("#004b85").text("AE TECH", 140, 25);

  // Subtítulo
  doc.fontSize(12).fillColor("#666").text("Soluciones tecnológicas profesionales", 140, 55);

  // Línea decorativa
  doc.moveTo(40, 85).lineTo(doc.page.width - 40, 85)
     .strokeColor("#004b85").lineWidth(1).stroke();

  doc.moveDown(2);
}

// -----------------------------------------------------------
// GENERAR PDF FINAL
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

    // Crear PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Reporte_Tarea_${tareaId}.pdf`);
    doc.pipe(res);

    const watermark = cargarMarcaAgua();

    // ======================================================
    //  PÁGINA 1 — INFORMACIÓN
    // ======================================================
    aplicarMarcaAgua(doc, watermark);
    headerAETech(doc);

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
    //  PÁGINA 2 — EVIDENCIAS (2 por página)
    // ======================================================
    doc.addPage();
    aplicarMarcaAgua(doc, watermark);

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

      if (y + img.height > doc.page.height - 80) {
        doc.addPage();
        aplicarMarcaAgua(doc, watermark);
        y = 80;
      }

      doc.image(imgBuffer, x, y, { width: img.width });
      doc.fontSize(12).text(ev.titulo || "Evidencia", x, y + img.height + 5);

      if (col === 0) col = 1;
      else { col = 0; y += img.height + GAP; }
    }

  // ======================================================
//   PÁGINA – FIRMA DEL CLIENTE  (PNG sin procesar)
// ======================================================
const evFirma = evidencias.find(e => e.firmaClienteUrl);

if (evFirma) {
  doc.addPage();
  aplicarMarcaAgua(doc, watermarkPath);

  doc.fontSize(20)
     .fillColor("#004b85")
     .text("Firma del Cliente", { underline: true });

  doc.moveDown(1);

  try {
      const firmaRes = await axios.get(evFirma.firmaClienteUrl, { responseType: "arraybuffer" });

      // ❗NO usar sharp — PDFKit soporta PNG con transparencia directamente
      const firmaPNG = firmaRes.data;
      const imgFirma = doc.openImage(firmaPNG);

      const x = (doc.page.width - imgFirma.width) / 2;
      doc.image(imgFirma, x, doc.y, {
        fit: [380, 240],
        align: "center"
      });

  } catch (err) {
      console.log("Error cargando firma:", err.message);
      doc.fillColor("red").text("⚠ No se pudo cargar la firma.");
  }
}


    // ======================================================
    //  MATERIALES
    // ======================================================
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      doc.addPage();
      aplicarMarcaAgua(doc, watermark);

      doc.fontSize(20).fillColor("#004b85").text("Material Ocupado", { underline: true });
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

    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
