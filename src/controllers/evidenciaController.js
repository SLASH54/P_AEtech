// ==============================
//       REPORTE PDF AETECH
// ==============================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const { Tarea, ClienteNegocio, Actividad, Sucursal, Usuario, Evidencia } = require('../models/relations');


// -------------------------------------------
//   UTIL: Comprimir cualquier imagen grande
// -------------------------------------------

async function procesarImagen(url, maxW = 350, maxH = 400) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate()
      .resize({
        width: maxW,
        height: maxH,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 75 })
      .toBuffer();
  } catch (err) {
    console.error("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}


// -------------------------------------------
//   MARCA DE AGUA EN TODAS LAS PÁGINAS
// -------------------------------------------

function marcaAgua(doc) {
  try {
    const wmPath = path.join(__dirname, "../public/watermark.png");
    if (!fs.existsSync(wmPath)) return;

    const wm = doc.openImage(wmPath);
    const W = wm.width * 0.55;
    const H = wm.height * 0.55;

    const x = (doc.page.width - W) / 2;
    const y = (doc.page.height - H) / 2;

    doc.save()
      .opacity(0.12)
      .image(wmPath, x, y, { width: W })
      .opacity(1)
      .restore();
  } catch (err) {
    console.log("⚠ Marca de agua:", err.message);
  }
}


// -------------------------------------------
//   EVIDENCIAS → 2 POR PÁGINA, CENTRADAS
// -------------------------------------------

async function dibujarEvidencias(doc, evidencias) {
  const maxW = 260;
  const maxH = 260;

  let col = 0; // 0 = izquierda, 1 = derecha
  let startY = doc.y;

  for (const ev of evidencias) {

    if (col === 0) {
      marcaAgua(doc);
    }

    const buffer = await procesarImagen(ev.archivoUrl, maxW, maxH);

    if (!buffer) continue;
    const img = doc.openImage(buffer);

    // Si no cabe, nueva página
    if (doc.y + img.height > doc.page.height - 100) {
      doc.addPage();
      marcaAgua(doc);
      startY = 100;
      col = 0;
    }

    // Coordenadas para 2 columnas
    const posX = col === 0 ? 70 : doc.page.width / 2 + 10;

    doc.image(buffer, posX, startY);

    // Título debajo
    doc.fontSize(11)
      .fillColor("black")
      .text(ev.titulo || "Evidencia", posX, startY + img.height + 5);

    // Alternar columna
    if (col === 0) {
      col = 1;
    } else {
      col = 0;
      startY += img.height + 60;
    }
  }

  doc.moveDown(2);
}



// -------------------------------------------
//            FIRMA → CENTRADA
// -------------------------------------------

async function dibujarFirma(doc, evidencias) {
  const evFirma = evidencias.find(e => e.firmaClienteUrl);
  if (!evFirma) return;

  doc.addPage();
  marcaAgua(doc);

  doc.fontSize(18).fillColor("#003366").text("Firma del Cliente", { align: "center" });
  doc.moveDown(1);

  const buffer = await procesarImagen(evFirma.firmaClienteUrl, 350, 250);
  if (!buffer) return;

  const img = doc.openImage(buffer);
  const x = (doc.page.width - img.width) / 2;

  doc.image(buffer, x, doc.y);
  doc.moveDown(2);
}



// -------------------------------------------
//     MATERIALES → AGRUPADOS Y ORDENADOS
// -------------------------------------------

function dibujarMateriales(doc, evidencias) {
  const materiales = evidencias[0]?.materiales || [];
  if (!materiales.length) return;

  doc.addPage();
  marcaAgua(doc);

  doc.fontSize(20)
    .fillColor("#003366")
    .text("Material Ocupado", { align: "left" });

  doc.moveDown(1);

  const grupos = {};

  for (const m of materiales) {
    if (!grupos[m.categoria]) grupos[m.categoria] = [];
    grupos[m.categoria].push(m);
  }

  for (const cat of Object.keys(grupos)) {
    doc.fontSize(15).fillColor("#003366").text(`• ${cat}`);
    doc.moveDown(0.4);

    for (const item of grupos[cat]) {
      doc.fontSize(12)
        .fillColor("black")
        .text(`- ${item.insumo}: ${item.cantidad} ${item.unidad}`, { indent: 20 });
    }

    doc.moveDown(1);
  }
}


// ===========================================
//       CONTROLADOR GENERAR PDF FINAL
// ===========================================

exports.generateReportePDF = async (req, res) => {
  try {
    const tareaId = req.params.tareaId;

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

    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    if (!tarea.Evidencia.length) return res.status(400).json({ error: "La tarea no tiene evidencias" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Reporte_Tarea_${tareaId}.pdf"`);

    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40,
      compress: true,
    });

    doc.pipe(res);

    // -----------------------
    // ENCABEZADO
    // -----------------------

    const logo = path.join(__dirname, "../public/logo.png");
    marcaAgua(doc);

    if (fs.existsSync(logo)) {
      doc.image(logo, 40, 30, { width: 90 });
    }

    doc.fontSize(22).fillColor("#003366").text("AE TECH", 150, 35);
    doc.fontSize(12).text("Reporte oficial de servicio", 150, 60);

    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(575, doc.y).stroke("#003366");
    doc.moveDown(1.2);

    // -----------------------
    // DETALLES DEL SERVICIO
    // -----------------------

    doc.fontSize(18).fillColor("#003366").text("Trabajo Realizado:");
    doc.fontSize(14).fillColor("black").text(tarea.nombre);
    doc.moveDown(1);

    doc.fontSize(18).fillColor("#003366").text("Detalles del servicio");
    doc.moveDown(0.8);

    doc.fontSize(12).fillColor("black");
    doc.text(`Cliente: ${tarea.ClienteNegocio?.nombre}`);
    doc.text(`Dirección del Cliente: ${tarea.ClienteNegocio?.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal?.nombre}`);
    doc.text(`Dirección de la Sucursal: ${tarea.Sucursal?.direccion}`);
    doc.text(`Actividad: ${tarea.Actividad?.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA?.nombre}`);
    doc.text(`Fecha de finalización: ${tarea.fechaLimite}`);
    doc.moveDown(1);

    doc.moveTo(40, doc.y).lineTo(575, doc.y).stroke("#003366");
    doc.moveDown(1.5);

    // -----------------------
    // EVIDENCIAS ORDENADAS
    // -----------------------

    doc.fontSize(18).fillColor("#003366").text("Evidencias Recopiladas");
    doc.moveDown(1);

    await dibujarEvidencias(doc, tarea.Evidencia);

    // -----------------------
    // FIRMA
    // -----------------------

    await dibujarFirma(doc, tarea.Evidencia);

    // -----------------------
    // MATERIALES
    // -----------------------

    dibujarMateriales(doc, tarea.Evidencia);

    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};
