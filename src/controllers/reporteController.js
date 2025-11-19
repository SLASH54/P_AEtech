// ======================================
//   REPORTE PDF AETECH - VERSION FINAL
// ======================================

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
  Evidencia,
} = require("../models/relations");

// ======================================================
//   RUTA CORRECTA PARA RENDER — public está en root/
// ======================================================
const publicDir = path.join(process.cwd(), "public");
const logoPath = path.join(publicDir, "logo.png");
const watermarkPath = path.join(publicDir, "watermark.png");

// ======================================================
//   UTIL: Marca de agua centrada (funciona en todas)
// ======================================================
function drawWatermark(doc) {
  if (!fs.existsSync(watermarkPath)) return;

  try {
    const wm = doc.openImage(watermarkPath);
    const scale = 0.45; // tamaño perfecto
    const w = wm.width * scale;
    const h = wm.height * scale;

    const x = (doc.page.width - w) / 2;
    const y = (doc.page.height - h) / 2;

    doc.save()
      .opacity(0.12)
      .image(wm, x, y, { width: w })
      .opacity(1)
      .restore();
  } catch (err) {
    console.log("⚠ Error dibujando watermark:", err.message);
  }
}

// ======================================================
//   UTIL: Encabezado con logo
// ======================================================
function drawHeader(doc) {
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 40, 25, { width: 80 });
    } catch (err) {
      console.log("⚠ Error dibujando logo:", err.message);
    }
  }

  doc.fontSize(20).fillColor("#003366").text("AE TECH", 140, 30);
  doc.fontSize(11).fillColor("#777").text("Reporte oficial de servicio", 140, 55);

  doc.moveTo(40, 90)
    .lineTo(550, 90)
    .stroke("#003366");

  doc.moveDown(2);
}

// ======================================================
//   UTIL: Procesar y comprimir imágenes Cloudinary
// ======================================================
async function procesarImagen(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate()
      .resize({
        width: 480,        // tamaño óptimo para carta
        height: 580,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// ======================================================
//   UTIL: Dibujar evidencias SIN amontonarse
// ======================================================

async function drawImages(doc, evidencias) {
  const MAX_W = 360; // ancho máximo reducido
  const MAX_H = 420; // alto máximo reducido

  let firmaDibujada = false;
  let materialesDibujados = false;

  for (const ev of evidencias) {

    // Título de la evidencia
    doc.fontSize(13).fillColor("#003366").text(`• ${ev.titulo || "Evidencia"}`);
    doc.moveDown(0.3);

    try {
      // Procesar imagen
      const imgBuffer = await procesarImagen(ev.archivoUrl);
      if (!imgBuffer) {
        doc.fillColor("red").text("(Imagen no disponible)");
        doc.moveDown(1);
        continue;
      }

      // Abrir buffer
      const img = doc.openImage(imgBuffer);

      // Calcular tamaño manteniendo proporción
      let w = img.width;
      let h = img.height;
      let scale = Math.min(MAX_W / w, MAX_H / h);

      w *= scale;
      h *= scale;

      // Salto de página si no cabe
      if (doc.y + h > doc.page.height - 80) {
        doc.addPage();
        drawWatermark(doc);
        drawHeader(doc);
      }

      // Centrado
      const x = (doc.page.width - w) / 2;

      doc.image(imgBuffer, x, doc.y, { width: w });
      doc.moveDown(1);

      // ======== Firma del cliente (solo una vez) ========
      if (!firmaDibujada && ev.firmaClienteUrl) {
        firmaDibujada = true;

        doc.moveDown(1);
        doc.fontSize(16).fillColor("#003366").text("✍️ Firma del Cliente", { align: "center" });
        doc.moveDown(0.5);

        const firmaBuffer = await procesarImagen(ev.firmaClienteUrl);
        if (firmaBuffer) {
          const firmaImg = doc.openImage(firmaBuffer);

          let fw = firmaImg.width;
          let fh = firmaImg.height;
          let fscale = Math.min(280 / fw, 180 / fh);

          fw *= fscale;
          fh *= fscale;

          const fx = (doc.page.width - fw) / 2;

          doc.image(firmaBuffer, fx, doc.y, { width: fw });
          doc.moveDown(2);
        }
      }

      // ======== Tabla de materiales agrupada (solo una vez) ========
      if (!materialesDibujados && ev.materiales?.length > 0) {
        materialesDibujados = true;

        doc.addPage();
        drawWatermark(doc);
        drawHeader(doc);

        doc.moveDown(1);
        doc.fontSize(16).fillColor("#003366").text("🧱 Material Ocupado", { underline: true });
        doc.moveDown(1);

        // Agrupar por categoría
        const grupos = {};
        ev.materiales.forEach(m => {
          if (!grupos[m.categoria]) grupos[m.categoria] = [];
          grupos[m.categoria].push(m);
        });

        for (const categoria of Object.keys(grupos).sort()) {
          doc.fontSize(14).fillColor("#003366").text(`• ${categoria}`);
          doc.moveDown(0.3);

          grupos[categoria].forEach(mat => {
            doc.fontSize(12).fillColor("black").text(
              `${mat.insumo} — ${mat.cantidad} ${mat.unidad}`,
              { indent: 20 }
            );
          });

          doc.moveDown(0.8);
        }
      }

    } catch (err) {
      console.error("⚠ Error insertando imagen:", err.message);
      doc.fillColor("red").text("(Error cargando imagen)");
    }

  }
}





// ======================================================
//   CONTROLADOR PRINCIPAL
// ======================================================
exports.generateReportePDF = async (req, res) => {
  try {
    const { tareaId } = req.params;

    const tarea = await Tarea.findOne({
      where: { id: tareaId },
      include: [
        { model: Actividad },
        { model: Sucursal },
        { model: ClienteNegocio },
        { model: Usuario, as: "AsignadoA" },
        { model: Evidencia },
      ],
    });

    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    if (!tarea.Evidencia || tarea.Evidencia.length === 0) {
      return res.status(400).json({ error: "La tarea no tiene evidencias" });
    }

    // =============================================
    //    CONFIGURAR PDF
    // =============================================
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Reporte_Tarea_${tareaId}.pdf"`
    );

    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40,
      compress: true,
    });

    doc.pipe(res);

    // aplicar en primera página
    drawWatermark(doc);
    drawHeader(doc);

    // repetir en nuevas páginas
    doc.on("pageAdded", () => {
      drawWatermark(doc);
      drawHeader(doc);
    });

    // =============================================
    //      DETALLES DE LA TAREA
    // =============================================
    doc.fontSize(18).fillColor("#003366").text("Trabajo Realizado");
    doc.moveDown(0.4);
    doc.fontSize(13).fillColor("black").text(tarea.nombre);
    doc.moveDown(1);

    doc.fontSize(18).fillColor("#003366").text("Detalles del servicio");
    doc.moveDown(0.6);

    doc.fontSize(12).fillColor("black");
    doc.text(`Cliente: ${tarea.ClienteNegocio?.nombre}`);
    doc.text(`Dirección Cliente: ${tarea.ClienteNegocio?.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal?.nombre}`);
    doc.text(`Dirección Sucursal: ${tarea.Sucursal?.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad?.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA?.nombre} (${tarea.AsignadoA?.rol})`);
    doc.text(`Fecha finalización: ${tarea.fechaLimite}`);

    doc.moveDown(1.2);

    // =============================================
    //      EVIDENCIAS
    // =============================================
    doc.fontSize(18).fillColor("#003366").text("Evidencias");
    doc.moveDown(0.8);

    await drawImages(doc, tarea.Evidencia);

    // =============================================
    // FIN DEL REPORTE
    // =============================================
    doc.end();
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
