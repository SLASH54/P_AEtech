// ==============================
//   REPORTE PDF AETECH (FINAL B)
//   Basado en tu archivo actual
//   Mismo estilo, todo corregido
// ==============================
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
  Evidencia
} = require("../models/relations");

// ======================================================
//                GENERAR REPORTE PDF FINAL
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

    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    const evidencias = tarea.Evidencia || [];

    // Crear documento PDF
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40,
      info: {
        Title: `Reporte Tarea ${tareaId}`
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Reporte_Tarea_${tareaId}.pdf`
    );

    doc.pipe(res);

    const logoPath = path.join(__dirname, "../public/logo.png");
    const watermarkPath = path.join(__dirname, "../public/watermark.png");

    // ======================================================
    //                FUNCIONES AUXILIARES
    // ======================================================

    const drawWatermark = () => {
      if (!fs.existsSync(watermarkPath)) return;

      try {
        const wm = doc.openImage(watermarkPath);
        const w = 350;
        const x = (doc.page.width - w) / 2;
        const y = 220;

        doc.save();
        doc.opacity(0.12);
        doc.image(watermarkPath, x, y, { width: w });
        doc.opacity(1);
        doc.restore();
      } catch {}
    };

    const procesarImagen = async (url, maxW, maxH) => {
      try {
        const resImg = await axios.get(url, { responseType: "arraybuffer" });
        return await sharp(resImg.data)
          .rotate()
          .resize({ width: maxW, height: maxH, fit: "inside" })
          .jpeg({ quality: 92 }) // ALTA CALIDAD
          .toBuffer();
      } catch (err) {
        console.log("Error procesando imagen:", err.message);
        return null;
      }
    };

    // ======================================================
    //              PORTADA / INFORMACIÓN PRINCIPAL
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

    // ======================================================
    //              PÁGINA DE EVIDENCIAS (2 por hoja)
    // ======================================================

    doc.addPage();
    drawWatermark();

    doc.fontSize(22).fillColor("#003366").text("Evidencias", {
      underline: true
    });
    doc.moveDown(1);

    const MAX_W = 260;
    const MAX_H = 320;
    let imagePosition = 0;

    for (const ev of evidencias) {
      const imgBuf = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);
      if (!imgBuf) continue;

      const img = doc.openImage(imgBuf);

      if (imagePosition === 0) {
        // Primera imagen de la hoja
        const x = (doc.page.width - img.width) / 2;
        doc.image(imgBuf, x, doc.y);
        doc.moveDown(1.5);
        imagePosition = 1;
      } else {
        // Segunda imagen
        const x = (doc.page.width - img.width) / 2;
        doc.image(imgBuf, x, doc.y);
        doc.moveDown(1.5);

        // Nueva página
        doc.addPage();
        drawWatermark();

        imagePosition = 0;
      }
    }

    // ======================================================
    //              FIRMA DEL CLIENTE
    // ======================================================

    const evidenciaConFirma = evidencias.find(
      (e) => e.firmaClienteUrl && e.firmaClienteUrl !== ""
    );

    if (evidenciaConFirma) {
      doc.addPage();
      drawWatermark();

      doc.fontSize(22).fillColor("#003366").text("Firma del Cliente", {
        underline: true
      });
      doc.moveDown(1);

      try {
        const fBuf = await procesarImagen(
          evidenciaConFirma.firmaClienteUrl,
          380,
          220
        );

        if (fBuf) {
          const img = doc.openImage(fBuf);
          const x = (doc.page.width - img.width) / 2;

          doc.image(fBuf, x, doc.y);
          doc.moveDown(1.5);
        } else {
          doc.text("⚠ No se pudo cargar la firma.");
        }
      } catch {
        doc.text("⚠ Error cargando la firma.");
      }
    }

    // ======================================================
    //              MATERIALES (última página)
    // ======================================================

    if (evidencias.length > 0 && evidencias[0].materiales) {
      doc.addPage();
      drawWatermark();

      doc
        .fontSize(22)
        .fillColor("#003366")
        .text("Material Ocupado", { underline: true });
      doc.moveDown(1);

      const mats = evidencias[0].materiales;
      const grupos = {};

      mats.forEach((m) => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      for (const cat of Object.keys(grupos)) {
        doc.fontSize(16).fillColor("#003366").text(`• ${cat}`);
        doc.moveDown(0.5);

        grupos[cat].forEach((m) => {
          doc
            .fontSize(12)
            .fillColor("#000")
            .text(`${m.insumo} — ${m.cantidad} ${m.unidad}`, {
              indent: 20
            });
        });

        doc.moveDown(1);
      }
    }

    // ======================================================
    //              FINALIZAR PDF
    // ======================================================
    doc.end();
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).json({
      error: "Error generando PDF",
      detalle: err.message
    });
  }
};
