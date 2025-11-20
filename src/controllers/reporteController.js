// ==============================
//       REPORTE PDF AETECH
// ==============================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { Tarea, Actividad, Sucursal, ClienteNegocio, Usuario, Evidencia } = require("../models/relations");

exports.generateReportePDF = async (req, res) => {
  const { tareaId } = req.params;

  try {
    const tareaId = req.params.id;

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

    // ============================================
    // CONFIGURACIÓN PDF
    // ============================================
    const doc = new PDFDocument({
      layout: "portrait",
      size: "LETTER",
      margin: 40
    });

    // STREAM PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Reporte_Tarea_${tareaId}.pdf"`);

    doc.pipe(res);

    // ============================================
    // ENCABEZADO
    // ============================================
    doc.fontSize(18).fillColor("#004b85").text("AE TECH");
    doc.fontSize(12).fillColor("black").text("Reporte oficial de servicio");
    doc.moveDown(1);

    // ============================================
    // DATOS DE LA TAREA
    // ============================================
    doc.fontSize(18).fillColor("#004b85").text("Detalles del servicio", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor("black").text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección de la Sucursal: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
    doc.text(`Fecha de finalización: ${tarea.fechaLimite}`);
    doc.text(`Trabajo Realizado: ${tarea.nombre}`);
    doc.moveDown(1);

    // ============================================
    // EVIDENCIAS
    // ============================================
    doc.addPage();
    doc.fontSize(18).fillColor("#004b85").text("Evidencias", { underline: true });
    doc.moveDown(1);

    const MAX_W = 450;
    const MAX_H = 550;

    for (const ev of evidencias) {
      doc.fontSize(14).fillColor("black").text(`• ${ev.titulo || "Evidencia"}`);
      doc.moveDown(0.3);

      try {
        const imgRes = await axios.get(ev.archivoUrl, { responseType: "arraybuffer" });
        const jpegBuffer = await sharp(imgRes.data)
          .rotate()
          .resize({ width: MAX_W, height: MAX_H, fit: "inside" })
          .jpeg({ quality: 80 })
          .toBuffer();

        const img = doc.openImage(jpegBuffer);
        const x = (doc.page.width - img.width) / 2;

        if (doc.y + img.height > doc.page.height - 60) {
          doc.addPage();
        }

        doc.image(jpegBuffer, x, doc.y);
        doc.moveDown(1);

      } catch (err) {
        doc.fillColor("red").text("⚠ Error cargando imagen");
        doc.moveDown(1);
      }
    }

    // ============================================
    // FIRMA DEL CLIENTE
    // ============================================
    const evidenciaConFirma = evidencias.find(e => e.firmaClienteUrl);

    if (evidenciaConFirma) {
      doc.addPage();
      doc.fontSize(18).fillColor("#004b85").text("Firma del Cliente", { underline: true });
      doc.moveDown(1);

      try {
        const firmaRes = await axios.get(evidenciaConFirma.firmaClienteUrl, { responseType: "arraybuffer" });

        const firmaBuf = await sharp(firmaRes.data)
          .rotate()
          .resize({ width: 350, height: 250, fit: "inside" })
          .jpeg({ quality: 90 })
          .toBuffer();

        const img = doc.openImage(firmaBuf);
        const x = (doc.page.width - img.width) / 2;

        doc.image(firmaBuf, x, doc.y);

      } catch (err) {
        doc.fillColor("red").text("⚠ Error cargando firma");
      }
    }

    // ============================================
    // MATERIALES
    // ============================================
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      doc.addPage();
      doc.fontSize(18).fillColor("#004b85").text("Material Ocupado", { underline: true });
      doc.moveDown(1);

      const grupos = {};

      materiales.forEach(m => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      for (const categoria of Object.keys(grupos)) {
        doc.fontSize(16).fillColor("#004b85").text(`• ${categoria}`);
        doc.moveDown(0.4);

        grupos[categoria].forEach(m => {
          doc.fontSize(12).fillColor("black").text(
            `${m.insumo} — ${m.cantidad} ${m.unidad}`,
            { indent: 20 }
          );
        });

        doc.moveDown(1);
      }
    }

    // ============================================
    // FINALIZAR PDF
    // ============================================
    doc.end();

  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ error: "Error al generar PDF", detalle: error.message });
  }
};
