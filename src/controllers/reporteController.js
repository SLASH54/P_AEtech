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
//   UTIL: Comprimir imagen sin romper PDF
// -------------------------------------------
async function procesarImagen(url, maxW, maxH, quality = 80) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate()
      .resize({
        width: maxW,
        height: maxH,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toBuffer();
  } catch (err) {
    console.error("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// -------------------------------------------
//   UTIL: Dibujar marca de agua centrada
// -------------------------------------------
function dibujarMarcaAgua(doc, wm) {
  if (!wm) return;

  doc.save();
  doc.opacity(0.08);

  const scale = 0.55;
  const w = wm.width * scale;
  const h = wm.height * scale;

  const x = (doc.page.width - w) / 2;
  const y = (doc.page.height - h) / 2;

  doc.image(wm, x, y, { width: w });
  doc.restore();
}

// -------------------------------------------
//           GENERAR PDF COMPLETO
// -------------------------------------------
exports.generateReportePDF = async (req, res) => {
  const { tareaId } = req.params;

  try {
    const tarea = await Tarea.findByPk(tareaId, {
      include: [
        { model: Actividad },
        { model: Sucursal },
        { model: ClienteNegocio },
        { model: Usuario, as: "AsignadoA" },
        { model: Evidencia },
      ],
    });

    if (!tarea) return res.status(404).json({ message: "Tarea no encontrada" });

    const evidencias = tarea.Evidencia || [];

    if (!evidencias.length)
      return res.status(400).json({ message: "La tarea no tiene evidencias" });

    // Crear documento PDF
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Reporte_Tarea_${tarea.id}.pdf"`);

    doc.pipe(res);

    // Rutas del logo y marca de agua
    const logoPath = path.join(__dirname, "../public/logo.png");
    const watermarkPath = path.join(__dirname, "../public/watermark.png");

    let logo = null;
    let wm = null;

    try { logo = doc.openImage(logoPath); } catch {}
    try { wm = doc.openImage(watermarkPath); } catch {}

    // Marca de agua en todas las páginas
    const renderWatermark = () => dibujarMarcaAgua(doc, wm);
    renderWatermark();
    doc.on("pageAdded", renderWatermark);

    // =================================
    // ENCABEZADO
    // =================================
    if (logo) doc.image(logo, 50, 40, { width: 110 });

    doc.fillColor("#004b85").fontSize(22).text("AE TECH", 180, 40);
    doc.fontSize(10).fillColor("#555").text("Reporte oficial de servicio", 180, 65);

    doc.moveDown(3);

    // Título principal
    doc.fontSize(18).fillColor("#000").text("Trabajo realizado: ", { continued: true });
    doc.text(tarea.nombre);

    doc.moveDown(1);

    // Detalles
    doc.fontSize(16).fillColor("#004b85").text("Detalles del servicio", { underline: true });
    doc.moveDown(0.7);

    doc.fontSize(12).fillColor("#000");

    const c = tarea.ClienteNegocio;
    const s = tarea.Sucursal;
    const a = tarea.Actividad;
    const u = tarea.AsignadoA;

    doc.text(`Cliente: ${c?.nombre}`);
    doc.text(`Dirección del Cliente: ${c?.direccion}`);
    doc.text(`Sucursal: ${s?.nombre}`);
    doc.text(`Dirección de la Sucursal: ${s?.direccion}`);
    doc.text(`Actividad: ${a?.nombre}`);
    doc.text(`Asignado a: ${u?.nombre} (${u?.rol})`);
    doc.text(`Fecha de finalización: ${tarea.fechaLimite}`);

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#004b85").stroke();
    doc.moveDown(1.5);

    // ===========================================
    //   EVIDENCIAS — 2 IMÁGENES POR FILA
    // ===========================================
    doc.addPage();
    doc.fontSize(18).fillColor("#004b85").text("Evidencias recopiladas", { underline: true });
    doc.moveDown(1);

    const MAX_W = 250;
    const MAX_H = 250;
    const GAP_X = 25;
    const GAP_Y = 40;

    const usableWidth = doc.page.width - 100;
    const columnWidth = (usableWidth - GAP_X) / 2;

    let col = 0;
    let y = doc.y;
    let rowHeight = 0;

    for (const ev of evidencias) {
      try {
        const buffer = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H, 80);
        if (!buffer) continue;

        const img = doc.openImage(buffer);

        const requiredHeight = img.height + 25;

        if (y + requiredHeight > doc.page.height - 70) {
          doc.addPage();
          doc.fontSize(18).fillColor("#004b85").text("Evidencias (cont.)", { underline: true });
          doc.moveDown(1);
          y = doc.y;
          col = 0;
        }

        const baseX = 50 + col * (columnWidth + GAP_X);
        const imgX = baseX + (columnWidth - img.width) / 2;

        doc.image(buffer, imgX, y);
        doc.fontSize(12).fillColor("#000").text(ev.titulo, baseX, y + img.height + 5, {
          width: columnWidth,
          align: "center",
        });

        rowHeight = Math.max(rowHeight, requiredHeight);

        if (col === 0) col = 1;
        else {
          col = 0;
          y += rowHeight + GAP_Y;
          rowHeight = 0;
        }
      } catch (err) {
        console.log("⚠ Error insertando evidencia:", err.message);
      }
    }

    // ===================================================
    //    FIRMA DEL CLIENTE
    // ===================================================
    const evFirma = evidencias.find((e) => e.firmaClienteUrl);

    if (evFirma?.firmaClienteUrl) {
      doc.addPage();
      doc.fontSize(20).fillColor("#004b85").text("Firma del cliente", { underline: true });
      doc.moveDown(1);

      try {
        const buf = await procesarImagen(evFirma.firmaClienteUrl, 400, 250, 90);
        const img = doc.openImage(buf);
        const x = (doc.page.width - img.width) / 2;

        doc.image(buf, x, doc.y + 20);
      } catch (err) {
        doc.fillColor("red").text("No se pudo cargar la firma");
      }
    }

    // ===================================================
    //   MATERIALES OCUPADOS (LIMPIO Y AGRUPADO)
    // ===================================================
    const materiales = evidencias
      .flatMap((e) => e.materiales || [])
      .reduce((acc, m) => {
        const key = `${m.categoria}||${m.insumo}||${m.unidad}`;
        acc[key] = (acc[key] || 0) + Number(m.cantidad);
        return acc;
      }, {});

    if (Object.keys(materiales).length) {
      doc.addPage();
      doc.fontSize(20).fillColor("#004b85").text("Material Ocupado", { underline: true });
      doc.moveDown(1);

      const ordenado = Object.entries(materiales).map(([k, cant]) => {
        const [categoria, insumo, unidad] = k.split("||");
        return { categoria, insumo, unidad, cant };
      });

      const porCat = {};
      ordenado.forEach((m) => {
        if (!porCat[m.categoria]) porCat[m.categoria] = [];
        porCat[m.categoria].push(m);
      });

      for (const cat of Object.keys(porCat).sort()) {
        doc.fontSize(14).fillColor("#004b85").text(`• ${cat}`);
        doc.moveDown(0.3);

        porCat[cat].forEach((m) => {
          doc.fontSize(12).fillColor("#000").text(`${m.insumo} — ${m.cant} ${m.unidad}`, {
            indent: 20,
          });
        });

        doc.moveDown(1);
      }
    }

    doc.end();
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    if (!res.headersSent) res.status(500).json({ message: "Error al generar PDF" });
  }
};
