// ===============================================================
//   LEVANTAMIENTOS CONTROLLER – VERSIÓN PRO (CON PLANTILLA Y CALIDAD)
// ===============================================================
const { Levantamiento } = require("../models");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp"); // Para mejorar la calidad
const cloudinary = require('cloudinary').v2;

// Funciones de ayuda (Copiadas de tu reporteController para mantener calidad)
async function procesarImagen(url, maxW, maxH) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return await sharp(res.data)
      .rotate() // Respeta la orientación del celular
      .jpeg({ quality: 90 })
      .resize({ width: maxW, height: maxH, fit: "inside" })
      .toBuffer();
  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

async function cargarImagen(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return res.data;
  } catch (err) { return null; }
}

exports.generateLevantamientoPDF = async (req, res) => {
  const MARGIN_TOP = 180;
  const MARGIN_LEFT = 50;

  try {
    const { id } = req.params;
    const lev = await Levantamiento.findByPk(id);
    if (!lev) return res.status(404).json({ msg: "No encontrado" });

    // URLs de tus recursos oficiales
    const logoURL = "https://p-aetech.onrender.com/public/logo.png";
    const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";

    const logoBuf = await cargarImagen(logoURL);
    const plantillaBuf = await cargarImagen(plantillaURL);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Levantamiento_${id}.pdf`);
    doc.pipe(res);

    // --- Función para aplicar fondo ---
    const aplicarFondo = () => {
      if (plantillaBuf) doc.image(plantillaBuf, 0, 0, { width: doc.page.width, height: doc.page.height });
      if (logoBuf) doc.image(logoBuf, 40, 20, { width: 110 });
      doc.y = MARGIN_TOP;
    };

    aplicarFondo();

    // --- Encabezado Limpio (Sin Folio feo) ---
    doc.fontSize(22).fillColor("#004b85").text("REPORTE DE LEVANTAMIENTO", 170, 40);
    doc.fontSize(11).fillColor("#444").text("AE TECH · Ingeniería y Soluciones", 170, 65);
    
    // --- Información General ---
    doc.y = MARGIN_TOP;
    doc.fontSize(18).fillColor("#00938f").text("DETALLES DEL SERVICIO", MARGIN_LEFT);
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor("black");
    doc.text(`Cliente: ${lev.cliente_nombre}`);
    doc.text(`Dirección: ${lev.direccion}`); // Aquí ya incluimos la sucursal/dirección
    doc.text(`Fecha: ${new Date(lev.fecha).toLocaleDateString()}`); // Fecha limpia
    doc.text(`Personal Técnico: ${lev.personal}`);
    doc.moveDown(2);

    // --- Necesidades y Fotos de Alta Calidad ---
    doc.fontSize(18).fillColor("#00938f").text("EVIDENCIAS Y NECESIDADES");
    doc.moveDown();

    if (lev.necesidades) {
      for (const nec of lev.necesidades) {
        // Verificar si cabe el texto y la imagen, si no, nueva página
        if (doc.y > 600) {
          doc.addPage();
          aplicarFondo();
        }

        doc.fontSize(12).fillColor("#333").text(`• ${nec.descripcion}`, { indent: 20 });
        doc.moveDown(0.5);
        
        if (nec.imagen) {
          const imgBuffer = await procesarImagen(nec.imagen, 400, 300);
          if (imgBuffer) {
            doc.image(imgBuffer, { width: 350, align: 'center' });
            doc.moveDown(1.5);
          }
        }
      }
    }

    // --- Materiales en página nueva ---
    if (lev.materiales && lev.materiales.length > 0) {
      doc.addPage();
      aplicarFondo();
      doc.fontSize(18).fillColor("#00938f").text("🧱 MATERIALES REQUERIDOS");
      doc.moveDown();

      lev.materiales.forEach(m => {
        doc.fontSize(12).fillColor("black")
           .text(`${m.insumo} — Cantidad: ${m.cantidad} ${m.unidad}`, { indent: 20 });
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    console.error("Error PDF:", error);
    res.status(500).send("Error al generar el PDF");
  }
};