// ===============================================================
//   REPORTE PDF AETECH – VERSIÓN MEJORADA (SIN PÁGINAS VACÍAS)
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
//   Procesar imagen
// =========================================================
async function procesarImagen(url, maxW, maxH, isSignature = false) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    // 1. Iniciamos sharp
    let pipeline = sharp(res.data).rotate();

    // 2. CONFIGURACIÓN DE CALIDAD
    if (isSignature) {
      // Para firmas: PNG con máxima calidad para evitar bordes borrosos
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else {
      // Para fotos: JPEG con calidad 95 y chromaSubsampling 4:4:4 (clave para nitidez)
      pipeline = pipeline.jpeg({ 
        quality: 95, 
        chromaSubsampling: '4:4:4', 
        force: true 
      });
    }

    // 3. RESIZE Y SALIDA
    // Tip: Asegúrate que maxW sea al menos 800 para evidencias
    return await pipeline
      .resize({ 
        width: maxW, 
        height: maxH, 
        fit: "inside",
        withoutEnlargement: true // 👈 No estira imágenes pequeñas (evita pixeleado)
      })
      .toBuffer();
  } catch (err) {
    console.log("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// =========================================================
//   Marca de agua
// =========================================================
function aplicarMarcaAgua(doc, watermarkBuf) {
  try {
    const wm = doc.openImage(watermarkBuf);
    doc.save();
    doc.opacity(0.25);
    const w = 620;
    const x = (doc.page.width - w) / 2;
    const y = 120;
    doc.image(wm, x, y, { width: w });
    doc.opacity(1);
    doc.restore();
  } catch (err) {
    console.log("⚠ Error pintando marca de agua:", err.message);
  }
}

// =========================================================
//   Footer (por página)
// =========================================================
function footer(doc) {
  doc.fontSize(10).fillColor("#555");
  doc.text(
    `AE TECH · Reporte oficial · Página ${doc.page.number}`,
    40,
    doc.page.height - 30, // 🔥 Más abajo aún
    { width: doc.page.width - 80, align: "center" }
  );
}
 
// =========================================================
//   Encabezado cada página
// =========================================================
function encabezado(doc, logoBuf, watermarkBuf) {
  aplicarMarcaAgua(doc, watermarkBuf);

  if (logoBuf) {
    const logo = doc.openImage(logoBuf);
    doc.image(logo, 40, 20, { width: 110 });
  }

  doc.fontSize(28).fillColor("#004b85").text("AE TECH", 170, 30);
  doc.fontSize(12).fillColor("#444").text("Reporte oficial de servicio", 170, 63);

  doc.moveTo(40, 90).lineTo(doc.page.width - 40, 90).stroke("#CCCCCC");
  doc.moveDown(2);
}

// =========================================================
//   Plantilla de fondo PDF (por página)
// =========================================================
function fondoPlantilla(doc, plantillaBuf) {
  try {
    const bg = doc.openImage(plantillaBuf);
    doc.image(bg, 0, 0, {
      width: doc.page.width,
      height: doc.page.height
    });
    doc.y = MARGIN_TOP; // 👈 AQUI COLOCAMOS EL CURSOR EN LA ZONA BLANCA
  } catch (err) {
    //console.log("⚠ Error aplicando plantilla:", err.message);
  }
}


// =========================================================
//   Nueva página sin páginas vacías
// =========================================================
function nuevaPagina(doc, plantillaBuf) {
  doc.addPage();
  fondoPlantilla(doc, plantillaBuf); // plantilla + posicionamiento correcto
}


// =========================================================
//   GENERAR REPORTE PDF
// =========================================================
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
      include: [ Actividad, Sucursal, ClienteNegocio, { model: ClienteDireccion, as: 'DireccionEspecifica' }, { model: Usuario, as: "AsignadoA" }, Evidencia ]
    });

    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

    const evidencias = tarea.Evidencia || [];

    const logoURL = "https://p-aetech.onrender.com/public/logo.png";
    const watermarkURL = "https://p-aetech.onrender.com/public/watermark.png";
    const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";


    const logoBuf = await cargarImagen(logoURL);
    const watermarkBuf = await cargarImagen(watermarkURL);
    const plantillaBuf = await cargarImagen(plantillaURL);


    const doc = new PDFDocument({ margin: 40, bufferPages: true });

doc.pipe(res);

// Área útil
const ANCHO_UTIL = doc.page.width - MARGIN_LEFT - MARGIN_RIGHT;

// 1. Buscamos la dirección en los datos traídos

//disque error del pdf de tareas
//me dijo gemini que lo borrara sin miedo y que me fueera a dormir y que solo era eso de codigo 


let textoDireccion = "No especificada";
if (tarea.DireccionEspecifica) {
    textoDireccion = tarea.DireccionEspecifica.alias || tarea.DireccionEspecifica.direccion;
}



    // Primera página
    // Primera página con plantilla
    fondoPlantilla(doc, plantillaBuf);

    doc.moveDown(7);

    doc.fontSize(20)
      .fillColor("#00938f")
      .text("INFORMACION DEL SERVICIO", MARGIN_LEFT, doc.y);

    doc.moveDown(1);

    doc.fontSize(12).fillColor("#000");

    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`, MARGIN_LEFT);
    doc.text(`Dirección del Cliente: ${textoDireccion}`, MARGIN_LEFT, doc.y);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`, MARGIN_LEFT);
    doc.text(`Dirección de Sucursal: ${tarea.Sucursal.direccion}`, MARGIN_LEFT);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`, MARGIN_LEFT);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre}`, MARGIN_LEFT);
    doc.text(`Fecha límite: ${tarea.fechaLimite}`, MARGIN_LEFT);

    // =============================================================
// EVIDENCIAS EN LA PRIMERA PÁGINA (SOLO 2 PRIMERAS)
// =============================================================
const MAX_W = 300, MAX_H = 300;
const GAP = 30;
doc.moveDown(1);

doc.fontSize(20)
    .fillColor("#00938f")
    .text("EVIDENCIAS", MARGIN_LEFT);

  doc.moveDown(1);

// Punto EXACTO donde empieza el hueco blanco:
let yPrimera = MARGIN_TOP + 250;  
let xLeft = MARGIN_LEFT;
let xRight = doc.page.width / 2 - 20;

// Tomar SOLO las primeras dos
const primerasDos = evidencias.slice(0, 2);

for (let i = 0; i < primerasDos.length; i++) {
  const ev = primerasDos[i];
  const imgBuffer = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);
  if (!imgBuffer) continue;

  const img = doc.openImage(imgBuffer);

  // Izquierda o derecha
  const x = i === 0 ? xLeft : xRight;

  doc.image(imgBuffer, x, yPrimera, {
    width: img.width,
    height: img.height,
  });

  doc.fontSize(12)
     .fillColor("#000")
     .text(ev.titulo || "Evidencia", x, yPrimera + img.height + 5);
}


    // =============================================================
// RESTO DE EVIDENCIAS (A PARTIR DE PÁGINA 2)
// =============================================================
const resto = evidencias.slice(2);

if (resto.length > 0) {
  nuevaPagina(doc, plantillaBuf);

  let col = 0;
  let y = MARGIN_TOP + 20;

  for (const ev of resto) {
    const imgBuffer = await procesarImagen(ev.archivoUrl, MAX_W, MAX_H);
    if (!imgBuffer) continue;

    const img = doc.openImage(imgBuffer);

    const x = col === 0
      ? MARGIN_LEFT
      : doc.page.width / 2 - 20;

    // Salto de página si se acerca al footer
    if (y + img.height > doc.page.height - 180) {
      nuevaPagina(doc, plantillaBuf);
      y = MARGIN_TOP + 60;
    }

    doc.image(imgBuffer, x, y, { width: img.width });

    doc.fontSize(12)
      .fillColor("#000")
      .text(ev.titulo || "Evidencia", x, y + img.height + 5);

    if (col === 0) col = 1;
    else {
      col = 0;
      y += img.height + GAP;
    }
  }
}

    // Firma
    const evFirma = evidencias.find(e => e.firmaClienteUrl);

    if (evFirma) {
      nuevaPagina(doc, plantillaBuf);
      doc.moveDown(7);

      doc.fontSize(20)
        .fillColor("#00938f")
        .text("FIRMA DEL CLIENTE", MARGIN_LEFT);

      doc.moveDown(2);

      const firmaBuf = await procesarImagen(evFirma.firmaClienteUrl, 380, 220, true);

      if (firmaBuf) {
        const img = doc.openImage(firmaBuf);
        const x = (doc.page.width - img.width) / 2;
        doc.image(firmaBuf, x, doc.y);
      } else {
        doc.fillColor("red").text("⚠ No se pudo cargar la firma.");
      }
    }

    // Materiales
    const materiales = evidencias[0]?.materiales || [];

    if (materiales.length > 0) {
      nuevaPagina(doc, plantillaBuf);
      doc.moveDown(5);

      doc.fontSize(20)
        .fillColor("#00938f")
        .text("MATERIAL OCUPADO", MARGIN_LEFT);

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
          doc.fontSize(12).fillColor("#000").text(
            `${m.insumo} — ${m.cantidad} ${m.unidad}`,
            { indent: 20 }
          );
        });

        doc.moveDown(1);
      }
    }

    // ================= FOOTER EN TODAS LAS PÁGINAS =================
//const pages = doc.bufferedPageRange();
//for (let i = 0; i < pages.count; i++) {
//  doc.switchToPage(i);
//  footer(doc);
//}

doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    return res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
