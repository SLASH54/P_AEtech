const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { Tarea, Actividad, Sucursal, ClienteNegocio, Usuario, Evidencia } = require("../models/relations");

// ======================================================
//                GENERAR REPORTE PDF
// ======================================================

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

    // ======================================================
    //                CONFIGURAR PDF
    // ======================================================

    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40,
      info: { Title: "Reporte de Servicio" }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=reporte_${tareaId}.pdf`);
    doc.pipe(res);

    const logoPath = path.join(__dirname, "../public/logo.png");
    const watermarkPath = path.join(__dirname, "../public/watermark.png");

    // ======================================================
    //                MARCA DE AGUA
    // ======================================================

    const drawWatermark = () => {
      try {
        if (fs.existsSync(watermarkPath)) {
          const wm = doc.openImage(watermarkPath);
          const scale = 0.85;
          const w = wm.width * scale;
          const h = wm.height * scale;

          doc.save();
          doc.opacity(0.12);
          doc.image(
            watermarkPath,
            (doc.page.width - w) / 2,
            (doc.page.height - h) / 2,
            { width: w }
          );
          doc.opacity(1);
          doc.restore();
        }
      } catch {}
    };

    // ======================================================
    //                PORTADA
    // ======================================================

    drawWatermark();

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 120 });
    }

    doc.fontSize(26).fillColor("#003366").text("REPORTE DE SERVICIO", 160, 40);
    doc.moveDown(2);

    doc.fontSize(14).fillColor("#000");
    doc.text(`Trabajo Realizado: ${tarea.nombre}`);
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección de Sucursal: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre}`);
    doc.text(`Fecha de Finalización: ${tarea.fechaLimite}`);
    doc.moveDown(2);

    doc.addPage();
    drawWatermark();

    // ======================================================
    //                EVIDENCIAS (2 por página)
    // ======================================================

    const MAX_W = 250;
    const MAX_H = 320;
    const SPACE_Y = 350;

    doc.fontSize(20).fillColor("#003366").text("Evidencias", { underline: true });
    doc.moveDown(1);

    let imagePosition = 0;

    for (const ev of evidencias) {
      try {
        const imgReq = await axios.get(ev.archivoUrl, { responseType: "arraybuffer" });
        const imgBuf = await sharp(imgReq.data)
          .rotate()
          .resize({ width: MAX_W, height: MAX_H, fit: "inside" })
          .jpeg({ quality: 90 })
          .toBuffer();

        const img = doc.openImage(imgBuf);

        // 2 imágenes por página
        if (imagePosition === 0) {
          // primera imagen arriba
          const x = (doc.page.width - img.width) / 2;
          doc.image(imgBuf, x, doc.y);
          doc.moveDown(1.5);
          imagePosition = 1;
        } else {
          // segunda imagen abajo
          const x = (doc.page.width - img.width) / 2;
          doc.image(imgBuf, x, doc.y);
          doc.moveDown(1);

          // Agregar nueva página
          doc.addPage();
          drawWatermark();
          imagePosition = 0;
        }
      } catch (err) {
        doc.fillColor("red").text(`⚠ Error cargando imagen: ${ev.titulo}`);
        doc.moveDown(1);
      }
    }

    // ======================================================
    //                FIRMA DEL CLIENTE
    // ======================================================

    const evidenciaConFirma = evidencias.find(e => e.firmaClienteUrl);

    if (evidenciaConFirma) {
      doc.addPage();
      drawWatermark();

      doc.fontSize(20).fillColor("#003366").text("Firma del Cliente", { underline: true });
      doc.moveDown(1);

      try {
        const fReq = await axios.get(evidenciaConFirma.firmaClienteUrl, { responseType: "arraybuffer" });

        const fBuf = await sharp(fReq.data)
          .resize({ width: 350, height: 200, fit: "inside" })
          .jpeg({ quality: 90 })
          .toBuffer();

        const img = doc.openImage(fBuf);

        const x = (doc.page.width - img.width) / 2;
        doc.image(fBuf, x, doc.y);
        doc.moveDown(2);

      } catch {
        doc.fillColor("red").text("⚠ Error cargando firma");
      }
    }

    // ======================================================
    //                MATERIAL OCUPADO
    // ======================================================

    doc.addPage();
    drawWatermark();
    doc.fontSize(20).fillColor("#003366").text("Material Ocupado", { underline: true });
    doc.moveDown(1);

    if (evidencias.length > 0 && evidencias[0].materiales) {
      const materials = evidencias[0].materiales;

      const grouped = {};

      materials.forEach(m => {
        if (!grouped[m.categoria]) grouped[m.categoria] = [];
        grouped[m.categoria].push(m);
      });

      for (const cat of Object.keys(grouped)) {
        doc.fontSize(16).fillColor("#003366").text(`• ${cat}`);
        doc.moveDown(0.3);

        grouped[cat].forEach(m => {
          doc.fontSize(12).fillColor("#000").text(
            `${m.insumo} — ${m.cantidad} ${m.unidad}`,
            { indent: 20 }
          );
        });

        doc.moveDown(1);
      }
    }

    // FINALIZAR PDF
    doc.end();

  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    return res.status(500).json({ error: "Error generando PDF" });
  }
};
