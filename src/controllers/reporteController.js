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
// 🔵 ENCABEZADO GLOBAL (páginas de contenido)
// =============================
function drawHeader(doc, tarea) {
  // Si quieres que la portada NO tenga header, descomenta:
  // if (doc.page.number === 1) return;

  // Logo pequeño
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 25, { width: 55 });
  }

  // Título SIEMPRE en coordenadas fijas (sin wrap)
  doc.fontSize(14).fillColor("#003366")
    .text("AE TECH – Reporte de Servicio", 120, 30, { lineBreak: false });

  // Subtítulo también con posición fija y sin wrap
  doc.fontSize(10).fillColor("#555")
    .text(
      `Cliente: ${tarea.ClienteNegocio?.nombre || ""}  ·  Sucursal: ${tarea.Sucursal?.nombre || ""}`,
      120,
      48,
      { lineBreak: false }
    );

  // Línea inferior del header
  doc.moveTo(40, 70).lineTo(550, 70).stroke("#003366");

  // Posición del cursor para contenido
  doc.y = 90;
}





// =============================
// 🔵 PIE DE PÁGINA GLOBAL
// =============================

function drawFooter(doc) {
  const bottom = doc.page.height - 40;

  doc.moveTo(40, bottom).lineTo(550, bottom).stroke("#003366");

  doc.fontSize(9).fillColor("#555")
    .text(
      "AE TECH · www.aetech.com.mx · Servicio Técnico 24/7",
      40,
      bottom + 5,
      { lineBreak: false }
    );

  doc.fontSize(9).fillColor("#777")
    .text(
      `Página ${doc.page.number}`,
      500,
      bottom + 5,
      { lineBreak: false }
    );
}


// =============================
// 🔵 PORTADA
// =============================
function drawCoverPage(doc, tarea) {
  // Marca de agua en portada
  drawWatermark(doc);

  // Logo grande
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 50, { width: 120 });
  }

  doc.moveDown(4);

  doc.fontSize(26).fillColor("#003366")
    .text("REPORTE DE SERVICIO", { align: "center" });

  doc.fontSize(15).fillColor("#777")
    .text("AE TECH", { align: "center" });

  doc.moveDown(2);

  doc.fontSize(14).fillColor("#000")
    .text(`Trabajo Realizado: ${tarea.titulo || tarea.Actividad?.nombre || ""}`, { align: "center" });

  doc.moveDown(1.5);

  doc.fontSize(14).fillColor("#000")
    .text(`Cliente: ${tarea.ClienteNegocio?.nombre}`, { align: "center" });
  doc.text(`Dirección: ${tarea.ClienteNegocio?.direccion}`, { align: "center" });
  doc.text(`Sucursal: ${tarea.Sucursal?.nombre}`, { align: "center" });
  doc.text(`Actividad: ${tarea.Actividad?.nombre}`, { align: "center" });
  doc.text(`Fecha de finalización: ${tarea.createdAt.toLocaleDateString()}`, { align: "center" });

  // Termina portada. NO agregamos página aquí.
  // La siguiente página la controlamos en generateReportePDF.
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
// =============================
// 🔵 EVIDENCIAS (IMÁGENES) — OPTIMIZADO
// =============================
async function drawEvidences(doc, evidencias) {
  if (!evidencias || evidencias.length === 0) return;

  doc.fontSize(18).fillColor("#003366")
    .text("Evidencias Recopiladas", { underline: true });

  doc.moveDown(1);

  const MAX_WIDTH = 420;   // ancho máximo en la página
  const MAX_HEIGHT = 550;  // alto máximo en la página

  for (const ev of evidencias) {
    // Título
    doc.fontSize(12).fillColor("black")
      .text(`• ${ev.titulo || "Evidencia"}`);
    doc.moveDown(0.4);

    try {
      // 1. Descargar imagen en buffer
      const imgResponse = await axios.get(ev.archivoUrl, {
        responseType: "arraybuffer",
        maxContentLength: 8 * 1024 * 1024 // evita imágenes ridículamente grandes
      });

      // 2. Optimizar SIEMPRE a JPEG pequeño
      let jpegBuffer = await sharp(imgResponse.data)
        .rotate()
        .resize({
          width: 1400,
          height: 1400,
          fit: "inside",
          withoutEnlargement: true
        })
        .jpeg({ quality: 70 })
        .toBuffer();

      // 3. Abrir en PDFKit
      const img = doc.openImage(jpegBuffer);

      // 4. Calcular escala límite para esta página
      const scale = Math.min(
        MAX_WIDTH / img.width,
        MAX_HEIGHT / img.height
      );

      const finalW = img.width * scale;
      const finalH = img.height * scale;

      // 5. Si NO cabe → Página nueva controlada por nosotros
      if (doc.y + finalH > doc.page.height - 100) {
        doc.addPage();
        drawWatermark(doc);
        // header/footer ya están dibujados para esta página en generateReportePDF
        doc.y = 90; // aseguramos comenzar bajo header
      }

      // 6. Dibujar centrado y proporcional
      const x = (doc.page.width - finalW) / 2;

      doc.image(jpegBuffer, x, doc.y, {
        width: finalW,
        height: finalH
      });

      doc.moveDown(1.2);

      jpegBuffer = null;

    } catch (error) {
      console.log("⚠ Error procesando imagen:", ev.archivoUrl, error.message);
      doc.text("(Imagen no disponible)");
      doc.moveDown(1);
    }

    // Liberar memoria entre imágenes (si Node se lanzó con --expose-gc)
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

    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Reporte_${tareaId}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // ========= PÁGINA 1: PORTADA =========
    drawCoverPage(doc, tarea);
    drawFooter(doc); // si quieres pie de página en portada

    // ========= PÁGINA 2: DETALLES + EVIDENCIAS =========
    doc.addPage();
    drawWatermark(doc);
    drawHeader(doc, tarea);
    drawFooter(doc);



    // DETALLES
    drawServiceDetails(doc, tarea);

    // EVIDENCIAS
    await drawEvidences(doc, tarea.Evidencia);



    // ========= PÁGINA 3+: MATERIALES (si existen) =========
    const materialesRaw = [];
    tarea.Evidencia.forEach(ev => {
      if (ev.materiales) {
        try {
          materialesRaw.push(...JSON.parse(ev.materiales));
        } catch { }
      }
    });

    if (materialesRaw.length > 0) {
      const grupos = {};
      materialesRaw.forEach(m => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      doc.addPage();
      drawWatermark(doc);
      drawHeader(doc, tarea);
      drawFooter(doc);

      drawMaterials(doc, grupos);
    }

    doc.end();

  } catch (err) {
    console.log("❌ Error PDF:", err);
    res.status(500).json({ error: "Error generando PDF" });
  }
};
