// ===============================================================
//   REPORTE PDF AETECH – VERSIÓN MEJORADA (SIN PÁGINAS VACÍAS)
// ===============================================================
const PDFDocument = require("pdfkit");
const axios = require("axios");
const Tarea = require("../models/Tarea");
const Evidencia = require("../models/Evidencia");
const MaterialOcupado = require("../models/MaterialOcupado");

// Descarga imagen
async function cargarImagen(url) {
  const respuesta = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(respuesta.data, "binary");
}

// ========================================
//  FONDO DE PLANTILLA CORPORATIVA
// ========================================
function fondoPlantilla(doc, plantillaBuf, MARGIN_TOP) {
  try {
    const bg = doc.openImage(plantillaBuf);
    doc.image(bg, 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });

    // Coloca el cursor en la zona blanca
    doc.y = MARGIN_TOP;
  } catch (err) {
    console.log("⚠ Error aplicando plantilla:", err.message);
  }
}

// ========================================
// NUEVA PÁGINA con PLANTILLA
// ========================================
function nuevaPagina(doc, plantillaBuf, MARGIN_TOP) {
  doc.addPage();
  fondoPlantilla(doc, plantillaBuf, MARGIN_TOP);
}

// ========================================
//         GENERAR REPORTE PDF
// ========================================
exports.generateReportePDF = async (req, res) => {
  // Margenes reales según la plantilla PDF
  const MARGIN_TOP = 180;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const MARGIN_BOTTOM = 120;

  const { tareaId } = req.params;

  try {
    const tarea = await Tarea.findOne({
      where: { id: tareaId },
      include: [
        { model: Evidencia, as: "Evidencia" },
        { model: MaterialOcupado, as: "Material" },
        "AsignadoA",
        "ClienteNegocio",
        "Sucursal",
        "Actividad",
      ],
    });

    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    const evidencias = tarea.Evidencia || [];
    const materiales = tarea.Material || [];

    // ----- URLs de imágenes -----
    const logoURL =
      "https://p-aetech.onrender.com/public/uploads/plantillas/logo.png";
    const watermarkURL =
      "https://p-aetech.onrender.com/public/uploads/plantillas/marca.png";
    const plantillaURL =
      "https://p-aetech.onrender.com/public/uploads/plantillas/plantilla_reporte.jpg";

    // Descarga imágenes
    const logoBuf = await cargarImagen(logoURL);
    const watermarkBuf = await cargarImagen(watermarkURL);
    const plantillaBuf = await cargarImagen(plantillaURL);

    // Crear PDF
    const doc = new PDFDocument({ margin: 40, bufferPages: true });
    doc.pipe(res);

    const ANCHO_UTIL = doc.page.width - MARGIN_LEFT - MARGIN_RIGHT;

    // ---------------------------------------------------------------
    // Página 1 — Información del Servicio
    // ---------------------------------------------------------------
    fondoPlantilla(doc, plantillaBuf, MARGIN_TOP);

    doc
      .fontSize(22)
      .fillColor("#004b85")
      .text("Información del servicio", MARGIN_LEFT, doc.y);

    doc.moveDown();
    doc.fillColor("#000").fontSize(12);

    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`, MARGIN_LEFT);
    doc.text(
      `Dirección del Cliente: ${tarea.ClienteNegocio.direccion}`,
      MARGIN_LEFT
    );
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`, MARGIN_LEFT);
    doc.text(
      `Dirección de Sucursal: ${tarea.Sucursal.direccion}`,
      MARGIN_LEFT
    );
    doc.text(`Actividad: ${tarea.Actividad.nombre}`, MARGIN_LEFT);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre}`, MARGIN_LEFT);
    doc.text(`Fecha límite: ${tarea.fechaLimite}`, MARGIN_LEFT);

    // ---------------------------------------------------------------
    // Página 2 — Evidencias
    // ---------------------------------------------------------------
    if (evidencias.length > 0) {
      nuevaPagina(doc, plantillaBuf, MARGIN_TOP);

      doc
        .fontSize(22)
        .fillColor("#004b85")
        .text("Evidencias", MARGIN_LEFT, doc.y);

      doc.moveDown(1);

      let x = MARGIN_LEFT;
      let y = doc.y + 10;
      const imgSize = 230;

      for (let i = 0; i < evidencias.length; i++) {
        const ev = evidencias[i];
        const imgBuf = await cargarImagen(ev.url);

        doc.image(imgBuf, x, y, { width: imgSize, height: imgSize });
        doc.fillColor("#004b85").fontSize(10).text(ev.descripcion, x, y + imgSize + 5);

        x += imgSize + 30;

        if (x + imgSize > doc.page.width - MARGIN_RIGHT) {
          x = MARGIN_LEFT;
          y += imgSize + 80;

          if (y + imgSize > doc.page.height - MARGIN_BOTTOM) {
            nuevaPagina(doc, plantillaBuf, MARGIN_TOP);
            doc
              .fontSize(22)
              .fillColor("#004b85")
              .text("Evidencias (continuación)", MARGIN_LEFT);
            doc.moveDown(1);
            x = MARGIN_LEFT;
            y = doc.y + 10;
          }
        }
      }
    }

    // ---------------------------------------------------------------
    // Página 3 — Firma
    // ---------------------------------------------------------------
    nuevaPagina(doc, plantillaBuf, MARGIN_TOP);

    doc
      .fontSize(22)
      .fillColor("#004b85")
      .text("Firma del Cliente", MARGIN_LEFT, doc.y);

    if (tarea.firmaUrl) {
      const firmaBuf = await cargarImagen(tarea.firmaUrl);
      doc.image(firmaBuf, MARGIN_LEFT, doc.y + 20, {
        width: 250,
      });
    }

    // ---------------------------------------------------------------
    // Página 4 — Material Ocupado
    // ---------------------------------------------------------------
    if (materiales.length > 0) {
      nuevaPagina(doc, plantillaBuf, MARGIN_TOP);

      doc
        .fontSize(22)
        .fillColor("#004b85")
        .text("Material Ocupado", MARGIN_LEFT, doc.y);

      doc.moveDown(1);
      doc.fillColor("#000").fontSize(12);

      materiales.forEach((mat) => {
        doc.text(`• ${mat.cantidad} x ${mat.nombre}`, MARGIN_LEFT);
      });
    }

    // Finalizar PDF
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error al generar el PDF",
      error,
    });
  }
};
