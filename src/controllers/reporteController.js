// ==============================
//   REPORTE PDF AETECH (FINAL)
// ==============================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const { 
  Tarea, Actividad, Sucursal, ClienteNegocio, Usuario, Evidencia 
} = require("../models/relations");

// -----------------------------------------------------------
// UTIL: Procesar imagen con sharp (nítida + tamaño correcto)
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
      .jpeg({ quality: 85 })
      .toBuffer();

  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// -----------------------------------------------------------
// CARGAR MARCA DE AGUA
// -----------------------------------------------------------
async function cargarMarcaAgua() {
  const wmPath = path.join(__dirname, "../public/watermark.png");

  if (!fs.existsSync(wmPath)) return null;

  return fs.readFileSync(wmPath);
}

function dibujarMarcaAgua(doc, wm) {
  if (!wm) return;

  doc.save();
  doc.opacity(0.08);

  const width = 350;
  const x = (doc.page.width - width) / 2;
  const y = 180;

  doc.image(wm, x, y, { width });
  doc.restore();
}


// =============================================================
//            GENERAR REPORTE PDF (PÁGINA 1 + EVIDENCIAS)
// =============================================================
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

    // ---------------------------------------------
    //   CREACIÓN DEL PDF
    // ---------------------------------------------
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Reporte_Tarea_${tareaId}.pdf`);
    doc.pipe(res);

    const watermarkBuffer = await cargarMarcaAgua();

    // ---------------------------------------------
    //   PORTADA (PÁGINA 1)
    // ---------------------------------------------
    dibujarMarcaAgua(doc, watermarkBuffer);

    // LOGO
    const logoPath = path.join(__dirname, "../public/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 20, { width: 90 });
    }

    doc.fontSize(26).fillColor("#004b85").text("AE TECH", 140, 30);
    doc.fontSize(14).fillColor("#444").text("Reporte oficial de servicio", 140, 60);

    doc.moveDown(3);

    doc
      .fontSize(20)
      .fillColor("#004b85")
      .text("Información del servicio", { underline: true });

    doc.moveDown(1);

    doc.fontSize(12).fillColor("black");
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Dirección de la Sucursal: ${tarea.Sucursal.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
    doc.text(`Fecha de finalización: ${tarea.fechaLimite}`);

    doc.moveDown(2);
    doc.addPage();

    // ---------------------------------------------
    //   EVIDENCIAS (2 POR PÁGINA)
    // ---------------------------------------------
    doc.fontSize(20).fillColor("#004b85").text("Evidencias", { underline: true });
    doc.moveDown(1);

    let col = 0;
    let y = doc.y;

    for (const ev of evidencias) {
      const buffer = await procesarImagen(ev.archivoUrl, 250, 250);
      if (!buffer) continue;

      const img = doc.openImage(buffer);

      const x = col === 0 ? 80 : doc.page.width / 2 + 10;

      if (y + img.height > doc.page.height - 80) {
        doc.addPage();
        dibujarMarcaAgua(doc, watermarkBuffer);
        y = 80;
      }

      doc.image(buffer, x, y);
      doc.fontSize(12).fillColor("black").text(ev.titulo || "Evidencia", x, y + img.height + 5);

      if (col === 1) {
        col = 0;
        y += img.height + 60;
      } else {
        col = 1;
      }
    }

        // ----------------------------------------------------
    //  FIRMA DEL CLIENTE
    // ----------------------------------------------------
    const evidenciaConFirma = evidencias.find(e => e.firmaClienteUrl);

    if (evidenciaConFirma) {
      doc.addPage();
      dibujarMarcaAgua(doc, watermarkBuffer);

      doc.fontSize(20).fillColor("#004b85").text("Firma del Cliente", { underline: true });
      doc.moveDown(1);

      try {
        const firmaBuf = await procesarImagen(evidenciaConFirma.firmaClienteUrl, 350, 200);

        if (firmaBuf) {
          const imgFirma = doc.openImage(firmaBuf);
          const x = (doc.page.width - imgFirma.width) / 2;

          doc.image(firmaBuf, x, doc.y);
          doc.moveDown(1.5);
        } else {
          doc.fillColor("red").text("⚠ No se pudo cargar la firma.");
        }

      } catch (err) {
        doc.fillColor("red").text("⚠ Error cargando firma del cliente");
      }
    }

    // ----------------------------------------------------
    //  MATERIALES OCUPADOS
    // ----------------------------------------------------
    let materiales = [];

    if (evidencias.length > 0 && evidencias[0].materiales) {
      materiales = evidencias[0].materiales;
    }

    if (materiales.length > 0) {
      doc.addPage();
      dibujarMarcaAgua(doc, watermarkBuffer);

      doc
        .fontSize(20)
        .fillColor("#004b85")
        .text("Material Ocupado", { underline: true });

      doc.moveDown(1);

      // Agrupación por categoría
      const grupos = {};

      materiales.forEach(m => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      // Ordenar categorías alfabéticamente
      const categoriasOrdenadas = Object.keys(grupos).sort();

      categoriasOrdenadas.forEach(cat => {
        doc.fontSize(16).fillColor("#004b85").text(`• ${cat}`);
        doc.moveDown(0.3);

        grupos[cat].forEach(m => {
          doc.fontSize(12).fillColor("black").text(
            `${m.insumo} — ${m.cantidad} ${m.unidad}`,
            { indent: 20 }
          );
        });

        doc.moveDown(1);
      });
    }

    // ----------------------------------------------------
    //   FINALIZAR EL PDF
    // ----------------------------------------------------
    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    return res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};

