const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require("sharp");

const { Tarea, Actividad, Sucursal, ClienteNegocio, Evidencia, Usuario } = require('../models/relations');

// =============================
// RUTAS DE IMÁGENES PUBLIC
// =============================
const publicDir = path.join(__dirname, "..", "..", "public");
const logoPath = path.join(publicDir, "logo.png");
const watermarkPath = path.join(publicDir, "watermark.png");


// =============================
// 🔵 DIBUJAR MARCA DE AGUA
// =============================
function drawWatermark(doc) {
  if (!fs.existsSync(watermarkPath)) return;
  const pw = doc.page.width;
  const ph = doc.page.height;

  doc.save();
  doc.opacity(0.18);
  doc.image(watermarkPath, pw / 2 - 300, ph / 2 - 300, { width: 600 });
  doc.opacity(1);
  doc.restore();
}


// =============================
// 🔵 ENCABEZADO GLOBAL (todas páginas menos portada)
// =============================
function drawHeader(doc, tarea) {
  if (doc.page.number === 1) return; // no encabezado en portada

  if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 25, { width: 55 });

  doc.fontSize(14).fillColor("#003366")
    .text("AE TECH – Reporte de Servicio", 120, 30);

  doc.fontSize(10).fillColor("#555")
    .text(
      `Cliente: ${tarea.ClienteNegocio?.nombre || ""}  ·  Sucursal: ${tarea.Sucursal?.nombre || ""}`,
      120,
      48
    );

  doc.moveTo(40, 70).lineTo(550, 70).stroke("#003366");
  doc.moveDown(2);
}


// =============================
// 🔵 PIE DE PÁGINA GLOBAL
// =============================
function drawFooter(doc) {
  const bottom = doc.page.height - 40;
  doc.moveTo(40, bottom).lineTo(550, bottom).stroke("#003366");

  doc.fontSize(9).fillColor("#555")
    .text("AE TECH · www.aetech.com.mx · Servicio Técnico 24/7", 40, bottom + 5);

  doc.text(`Página ${doc.page.number}`, 500, bottom + 5);
}


// =============================
// 🔵 PORTADA
// =============================
function drawCoverPage(doc, tarea) {
  drawWatermark(doc);

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 50, { width: 120 });
  }

  doc.moveDown(4);

  doc.fontSize(26).fillColor("#003366")
    .text("REPORTE DE SERVICIO", { align: "center" });

  doc.fontSize(15).fillColor("#777")
    .text("AE TECH", { align: "center" });

  doc.moveDown(3);

  doc.fontSize(14).fillColor("#000")
    .text(`Cliente: ${tarea.ClienteNegocio?.nombre}`, { align: "center" });
  doc.text(`Sucursal: ${tarea.Sucursal?.nombre}`, { align: "center" });
  doc.text(`Dirección: ${tarea.Sucursal?.direccion}`, { align: "center" });
  doc.text(`Actividad: ${tarea.Actividad?.nombre}`, { align: "center" });
  doc.text(`Trabajo Realizado: ${tarea.titulo || tarea.Actividad?.nombre}`, { align: "center" });

  doc.addPage();
}


// =============================
// 🔵 DETALLES DEL SERVICIO
// =============================
function drawServiceDetails(doc, tarea) {
  doc.fontSize(18).fillColor("#003366")
    .text("Detalles del Servicio", { underline: true });

  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000");
  doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
  doc.text(`Dirección Cliente: ${tarea.ClienteNegocio.direccion}`);
  doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
  doc.text(`Dirección Sucursal: ${tarea.Sucursal.direccion}`);
  doc.text(`Actividad: ${tarea.Actividad.nombre}`);
  doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
  doc.text(`Fecha finalizada: ${tarea.createdAt.toLocaleDateString()}`);

  doc.moveDown(1);
  doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke("#CCCCCC");
  doc.moveDown(1.5);
}


// =============================
// 🔵 EVIDENCIAS (IMÁGENES)
// =============================
async function drawEvidences(doc, evidencias) {
  doc.fontSize(18).fillColor("#003366")
    .text("Evidencias Recopiladas", { underline: true });
  doc.moveDown(1);

  const MAX_WIDTH = 480;
  const MAX_HEIGHT = 620;

  for (const ev of evidencias) {
    doc.fontSize(12).fillColor("black")
      .text(`• ${ev.titulo || "Evidencia"}`);
    doc.moveDown(0.3);

    try {
      // 1️⃣ Descargar imagen con stream (consume MUCHA menos RAM)
      const response = await axios.get(ev.archivoUrl, {
        responseType: "arraybuffer",
        maxContentLength: 5 * 1024 * 1024, // evitar imágenes gigantes
      });

      // 2️⃣ Reducir tamaño ANTES de PDFKit
      let jpegBuffer = await sharp(response.data)
        .rotate() // corregir rotación
        .resize({
          width: 1280,    // tamaño max seguro
          height: 1280,
          fit: "inside",
          withoutEnlargement: true
        })
        .jpeg({ quality: 70 }) // compresión ligera
        .toBuffer();

      // Liberar la imagen original de memoria
      response.data = null;

      // 3️⃣ Abrir imagen optimizada
      const img = doc.openImage(jpegBuffer);

      // 4️⃣ Calcular tamaño para PDF
      const scale = Math.min(
        MAX_WIDTH / img.width,
        MAX_HEIGHT / img.height
      );
      const w = img.width * scale;
      const h = img.height * scale;

      if (doc.y + h > doc.page.height - 120) {
        doc.addPage();
      }

      const x = (doc.page.width - w) / 2;
      doc.image(jpegBuffer, x, doc.y, { width: w });

      // 5️⃣ Liberar memoria del buffer
      jpegBuffer = null;

      doc.moveDown(1.2);

    } catch (err) {
      console.log("⚠ Error insertando imagen:", err.message);
      doc.text("(Imagen no disponible)");
      doc.moveDown(1);
    }

    // 6️⃣ Forzar GC entre imágenes (evita crash por memoria)
    if (global.gc) global.gc();
  }
}



// =============================
// 🔵 MATERIALES
// =============================
function drawMaterials(doc, grupos) {
  doc.addPage();

  doc.fontSize(18).fillColor("#003366")
    .text("Material Ocupado", { underline: true, align: "center" });
  doc.moveDown(1);

  Object.keys(grupos).sort().forEach(cat => {
    doc.fontSize(15).fillColor("#444").text(`• ${cat}`);
    doc.moveDown(0.2);

    grupos[cat].forEach(m => {
      doc.fontSize(12).fillColor("#000")
        .text(`   - ${m.insumo} — ${m.cantidad} ${m.unidad}`);
    });

    doc.moveDown(0.8);
  });
}



// =============================
// 🔵 CONTROLLER FINAL
// =============================
exports.generateReportePDF = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const tarea = await Tarea.findByPk(tareaId, {
      include: [
        { model: Actividad },
        { model: Sucursal },
        { model: ClienteNegocio },
        { model: Usuario, as: "AsignadoA" },
        { model: Evidencia }
      ]
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Reporte_${tareaId}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // Marca en TODAS las páginas nuevas
    doc.on("pageAdded", () => {
      drawWatermark(doc);
      drawHeader(doc, tarea);
      drawFooter(doc);
    });

    // PORTADA
    drawCoverPage(doc, tarea);

    // ENCABEZADO + FOOTER
    drawHeader(doc, tarea);
    drawFooter(doc);

    drawWatermark(doc);

    // DETALLES
    drawServiceDetails(doc, tarea);

    // EVIDENCIAS
    await drawEvidences(doc, tarea.Evidencia);

    // AGRUPAR MATERIALES
    const materialesRaw = [];
    tarea.Evidencia.forEach(ev => {
      if (ev.materiales) {
        try {
          materialesRaw.push(...JSON.parse(ev.materiales));
        } catch { }
      }
    });

    const grupos = {};
    materialesRaw.forEach(m => {
      if (!grupos[m.categoria]) grupos[m.categoria] = [];
      grupos[m.categoria].push(m);
    });

    // TABLA MATERIALES
    if (materialesRaw.length > 0) drawMaterials(doc, grupos);

    doc.end();

  } catch (err) {
    console.log("❌ Error PDF:", err);
    res.status(500).json({ error: "Error generando PDF" });
  }
};
