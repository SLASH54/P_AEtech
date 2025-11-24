// ===============================================================
//   REPORTE PDF AETECH – VERSIÓN PREMIUM FINAL
// ===============================================================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");

// MODELOS
const {
  Tarea,
  Actividad,
  Sucursal,
  ClienteNegocio,
  Usuario,
  Evidencia
} = require("../models/relations");

// ===========================================================
//  Cargar imagen desde URL (logo, marca de agua, evidencias, firmas)
// ===========================================================
async function cargarBufferDesdeURL(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return res.data;
  } catch (err) {
    console.log("⚠ Error cargando imagen:", url, err.message);
    return null;
  }
}

// ===========================================================
//  Procesar imagen con sharp (firma sin fondo negro)
// ===========================================================
async function procesarImagen(url, maxW, maxH, isSignature = false) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    let pipe = sharp(res.data).rotate();

    if (isSignature) pipe = pipe.png();
    else pipe = pipe.jpeg({ quality: 90 });

    return await pipe
      .resize({ width: maxW, height: maxH, fit: "inside", withoutEnlargement: true })
      .toBuffer();

  } catch (e) {
    console.log("⚠ Error procesando imagen:", url, e.message);
    return null;
  }
}

// ===========================================================
//  MARCA DE AGUA
// ===========================================================
function aplicarMarcaAgua(doc, wmBuf) {
  if (!wmBuf) return;
  try {
    const wm = doc.openImage(wmBuf);

    doc.save();
    doc.opacity(0.25);

    const width = 420;
    const x = (doc.page.width - width) / 2;
    const y = 160;

    doc.image(wm, x, y, { width });
    doc.opacity(1);
    doc.restore();
  } catch (e) {
    console.log("⚠ Error al pintar marca de agua:", e.message);
  }
}

// ===========================================================
//  FOOTER Premium en cada página
// ===========================================================
function agregarFooter(doc, pageNumber, totalPages) {
  doc.save();

  // Línea superior
  doc.moveTo(40, doc.page.height - 60)
     .lineTo(doc.page.width - 40, doc.page.height - 60)
     .strokeColor("#004b85")
     .lineWidth(1)
     .stroke();

  doc.fontSize(9).fillColor("#555");

  // Texto izquierda
  doc.text("AETECH ® 2025 | Reporte de Servicio", 40, doc.page.height - 50, {
    align: "left"
  });

  // Número de página
  doc.text(`Página ${pageNumber} de ${totalPages}`, -40, doc.page.height - 50, {
    align: "right"
  });

  doc.restore();
}

// ===========================================================
//       GENERAR REPORTE PREMIUM
// ===========================================================
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

    // ==========================================
    //  Logos externos (funcionan en Render)
    // ==========================================
    const logoURL = "https://p-aetech.onrender.com/public/logo.png";
    const wmURL   = "https://p-aetech.onrender.com/public/watermark.png";

    const logoBuf = await cargarBufferDesdeURL(logoURL);
    const wmBuf   = await cargarBufferDesdeURL(wmURL);

    // ==========================================
    //  Crear PDF
    // ==========================================
    const doc = new PDFDocument({ margin: 40 });
    const stream = res;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition",
      `attachment; filename=Reporte_Tarea_${tareaId}.pdf`);

    doc.pipe(stream);

    // Usaremos un contador de páginas para el footer
    let pageIndex = 1;
    const paginasRequeridas = 1 + 1 + 1 + 1; // portada + evidencias + firma + materiales
    // luego ajustamos dinámico

    // ========================================================
    //   PORTADA PREMIUM
    // ========================================================
    aplicarMarcaAgua(doc, wmBuf);

    // LOGO
    if (logoBuf) {
      const logo = doc.openImage(logoBuf);
      doc.image(logo, (doc.page.width - 140) / 2, 60, { width: 140 });
    }

    doc.fontSize(28).fillColor("#004b85")
       .text("AETECH – Reporte Oficial", { align: "center" });

    doc.moveDown(1);

    doc.fontSize(18).fillColor("#666")
       .text(`Tarea: ${tarea.nombre}`, { align: "center" });

    doc.moveDown(8);

    doc.fontSize(14).fillColor("#444")
       .text("Generado automáticamente por el sistema AETECH", {
         align: "center"
       });

    agregarFooter(doc, pageIndex, paginasRequeridas);
    pageIndex++;

    // ========================================================
    //   INFORMACIÓN DEL SERVICIO
    // ========================================================
    doc.addPage();
    aplicarMarcaAgua(doc, wmBuf);

    doc.fontSize(22).fillColor("#004b85")
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

    agregarFooter(doc, pageIndex, paginasRequeridas);
    pageIndex++;

    // ========================================================
    //   EVIDENCIAS (2 POR PÁGINA)
    // ========================================================
    doc.addPage();
    aplicarMarcaAgua(doc, wmBuf);

    doc.fontSize(22).fillColor("#004b85")
       .text("Evidencias", { underline: true });

    doc.moveDown(1);

    const MAX_W = 260;
    const MAX_H = 260;

    let col = 0;
    let y = 130;

    for (const ev of evidencias) {
      const imgBuf = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);

      if (!imgBuf) continue;

      const img = doc.openImage(imgBuf);
      const x = col === 0 ? 60 : doc.page.width / 2 + 10;

      if (y + img.height > doc.page.height - 100) {
        agregarFooter(doc, pageIndex, paginasRequeridas);
        pageIndex++;

        doc.addPage();
        aplicarMarcaAgua(doc, wmBuf);
        y = 100;
      }

      doc.image(imgBuf, x, y, { width: img.width });
      doc.fontSize(12).fillColor("#000").text(ev.titulo || "Evidencia", x, y + img.height + 5);

      if (col === 0) col = 1;
      else { col = 0; y += img.height + 60; }
    }

    agregarFooter(doc, pageIndex, paginasRequeridas);
    pageIndex++;

    // ========================================================
    //   FIRMA DEL CLIENTE
    // ========================================================
    const evFirma = evidencias.find(e => e.firmaClienteUrl);

    if (evFirma) {
      doc.addPage();
      aplicarMarcaAgua(doc, wmBuf);

      doc.fontSize(22).fillColor("#004b85")
         .text("Firma del Cliente", { underline: true });

      doc.moveDown(1);

      const firmaBuf = await procesarImagen(
        evFirma.firmaClienteUrl,
        380,
        220,
        true  // PNG → evita fondo negro
      );

      if (firmaBuf) {
        const img = doc.openImage(firmaBuf);
        const x = (doc.page.width - img.width) / 2;
        doc.image(img, x, doc.y + 30);
      } else {
        doc.fillColor("red").text("⚠ No se pudo cargar la firma.");
      }

      agregarFooter(doc, pageIndex, paginasRequeridas);
      pageIndex++;
    }

    // ========================================================
    //   MATERIALES
    // ========================================================
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      doc.addPage();
      aplicarMarcaAgua(doc, wmBuf);

      doc.fontSize(22).fillColor("#004b85")
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

      agregarFooter(doc, pageIndex, paginasRequeridas);
      pageIndex++;
    }

    doc.end();

  } catch (e) {
    console.log("❌ Error generando PDF:", e);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
