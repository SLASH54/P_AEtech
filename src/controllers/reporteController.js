// ===============================================================
//   REPORTE PDF AETECH – VERSIÓN FINAL OPTIMIZADA
// ===============================================================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const {
  Tarea,
  Actividad,
  Sucursal,
  ClienteNegocio,
  Usuario,
  Evidencia,
  ClienteDireccion
} = require("../models/relations");

// Margenes globales según tu plantilla
const MARGIN_TOP = 180;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_BOTTOM = 120;

// =========================================================
//   Cargar imagen
// =========================================================
async function cargarImagen(urlOrPath) {
  try {
    if (urlOrPath.startsWith("http")) {
      const res = await axios.get(urlOrPath, { responseType: "arraybuffer" });
      return res.data;
    } else {
      return fs.readFileSync(urlOrPath);
    }
  } catch (err) {
    console.log("⚠ Error cargando imagen:", urlOrPath, err.message);
    return null;
  }
}

// =========================================================
//   Procesar imagen con Sharp para nitidez
// =========================================================
async function procesarImagen(url, maxW, maxH, isSignature = false) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    let pipeline = sharp(res.data).rotate();

    if (isSignature) {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else {
      pipeline = pipeline.jpeg({ quality: 95, chromaSubsampling: '4:4:4', force: true });
    }

    return await pipeline
      .resize({ width: maxW, height: maxH, fit: "cover", withoutEnlargement: false })
      .toBuffer();
  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// =========================================================
//   Plantilla de fondo PDF
// =========================================================
function fondoPlantilla(doc, plantillaBuf) {
  try {
    const bg = doc.openImage(plantillaBuf);
    doc.image(bg, 0, 0, { width: doc.page.width, height: doc.page.height });
    doc.y = MARGIN_TOP; 
  } catch (err) {}
}

function nuevaPagina(doc, plantillaBuf) {
  doc.addPage();
  fondoPlantilla(doc, plantillaBuf);
}

// =========================================================
//   GENERAR REPORTE PDF (Export)
// =========================================================
exports.generateReportePDF = async (req, res) => {
  const { tareaId } = req.params;

  try {
    const tarea = await Tarea.findOne({
      where: { id: tareaId },
      include: [ 
        Actividad, 
        Sucursal, 
        ClienteNegocio, 
        { model: ClienteDireccion, as: 'DireccionEspecifica' }, 
        { model: Usuario, as: "AsignadoA" }, 
        Evidencia 
      ]
    });

    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

    const evidencias = tarea.Evidencia || [];
    const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/PLANTILLAPDF.jpeg";
    const plantillaBuf = await cargarImagen(plantillaURL);

    const doc = new PDFDocument({ margin: 40, bufferPages: true });
    doc.pipe(res);

    let textoDireccion = tarea.DireccionEspecifica 
      ? (tarea.DireccionEspecifica.alias || tarea.DireccionEspecifica.direccion) 
      : "No especificada";

    // --- PÁGINA 1: INFORMACIÓN Y PRIMERAS FOTOS ---
    fondoPlantilla(doc, plantillaBuf);
    doc.moveDown(3);

    doc.fontSize(16).fillColor("#00938f").text("INFORMACIÓN DEL SERVICIO", MARGIN_LEFT);
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#000");
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección: ${textoDireccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Técnico: ${tarea.AsignadoA.nombre}`);
    doc.text(`Fecha: ${tarea.fechaLimite}`);

    doc.moveDown(1.5);
    doc.fontSize(16).fillColor("#00938f").text("EVIDENCIAS FOTOGRÁFICAS", MARGIN_LEFT);

    const MAX_W = 240, MAX_H = 180, GAP = 220;
    const primerasCuatro = evidencias.filter(e => e.archivoUrl).slice(0, 4);
    
    let yFotos = doc.y + 10;
    for (let i = 0; i < primerasCuatro.length; i++) {
      const ev = primerasCuatro[i];
      const imgBuffer = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);
      if (!imgBuffer) continue;

      const x = (i % 2 === 0) ? MARGIN_LEFT : (doc.page.width / 2 + 5);
      doc.image(imgBuffer, x, yFotos, { width: MAX_W, height: MAX_H });
      doc.fontSize(9).fillColor("#333").text(ev.titulo || "Evidencia", x, yFotos + MAX_H + 5, { width: MAX_W, align: "center" });

      if (i === 1) yFotos += GAP;
    }

    // --- PÁGINAS SIGUIENTES: RESTO DE FOTOS ---
    const resto = evidencias.filter(e => e.archivoUrl).slice(4);
    if (resto.length > 0) {
      nuevaPagina(doc, plantillaBuf);
      let col = 0, y = MARGIN_TOP + 10;
      for (const ev of resto) {
        const imgBuffer = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);
        if (!imgBuffer) continue;
        if (y + MAX_H + 40 > doc.page.height - MARGIN_BOTTOM) {
          nuevaPagina(doc, plantillaBuf);
          y = MARGIN_TOP + 10; col = 0;
        }
        const x = col === 0 ? MARGIN_LEFT : (doc.page.width / 2 + 5);
        doc.image(imgBuffer, x, y, { width: MAX_W, height: MAX_H });
        doc.fontSize(9).text(ev.titulo || "Evidencia", x, y + MAX_H + 5, { width: MAX_W, align: "center" });
        if (col === 0) { col = 1; } else { col = 0; y += GAP; }
      }
    }

    // --- SECCIÓN: FIRMA DEL CLIENTE ---
    const evFirma = evidencias.find(e => e.firmaClienteUrl);
    if (evFirma) {
      nuevaPagina(doc, plantillaBuf);
      doc.moveDown(2);
      doc.fontSize(16).fillColor("#00938f").text("FIRMA DE CONFORMIDAD", MARGIN_LEFT, doc.y, { align: 'center' });
      doc.moveDown(1);

      const firmaBuf = await procesarImagen(evFirma.firmaClienteUrl, 300, 150, true);
      if (firmaBuf) {
        const xCentrado = (doc.page.width - 300) / 2;
        doc.image(firmaBuf, xCentrado, doc.y, { width: 300 });
        doc.moveDown(0.5);
        
        // Línea de firma
        const xLinea = (doc.page.width - 250) / 2;
        doc.strokeColor("#000").lineWidth(1).moveTo(xLinea, doc.y).lineTo(xLinea + 250, doc.y).stroke();
        
        // Nombre del Cliente (Desde Neon 🟢)
        doc.moveDown(0.2);
        doc.fontSize(12).fillColor("#000").text(
          evFirma.nombreFirma ? evFirma.nombreFirma.toUpperCase() : "NOMBRE NO PROPORCIONADO",
          xLinea, doc.y, { width: 250, align: 'center' }
        );
        doc.fontSize(10).fillColor("#666").text("NOMBRE Y FIRMA DEL CLIENTE", { align: 'center' });
      }
    }

    // --- SECCIÓN: MATERIALES ---
    const evMat = evidencias.find(e => e.materiales && e.materiales.length > 0);
    if (evMat) {
      // Si la firma dejó poco espacio, agregamos página
      if (doc.y > 500) nuevaPagina(doc, plantillaBuf);
      
      doc.moveDown(2);
      doc.fontSize(16).fillColor("#00938f").text("MATERIAL OCUPADO", MARGIN_LEFT);
      doc.moveDown(0.5);

      const lista = Array.isArray(evMat.materiales) ? evMat.materiales : JSON.parse(evMat.materiales || '[]');
      const grupos = {};
      lista.forEach(m => {
        const cat = m.categoria || "Otros";
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push(m);
      });

      for (const cat of Object.keys(grupos)) {
        doc.fontSize(13).fillColor("#004b85").text(`• ${cat}`, { indent: 10 });
        grupos[cat].forEach(m => {
          doc.fontSize(11).fillColor("#333").text(`${m.insumo} — ${m.cantidad} ${m.unidad}`, { indent: 30 });
        });
        doc.moveDown(0.5);
      }
    }

    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    if (!res.headersSent) res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};