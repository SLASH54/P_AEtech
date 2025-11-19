// ==============================
//       REPORTE PDF AETECH
// ==============================

const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { Tarea, Actividad, Sucursal, ClienteNegocio, Usuario, Evidencia } = require("../models/relations");

// -------------------------------------------
//   UTIL: Comprimir cualquier imagen grande
// -------------------------------------------

async function procesarImagen(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });

    return await sharp(res.data)
      .rotate() // corrige orientación EXIF
      .resize({
        width: 550,
        height: 650,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 70 }) // compresión agresiva para evitar cuelgues
      .toBuffer();
  } catch (err) {
    console.error("⚠ Error procesando imagen:", url, err.message);
    return null;
  }
}

// -------------------------------------------
//   UTIL: Dibujar marca de agua centrada
// -------------------------------------------

function dibujarMarcaAgua(doc, watermarkPath) {
  try {
    if (!fs.existsSync(watermarkPath)) return;

    const wm = doc.openImage(watermarkPath);
    const scale = 0.55;

    const wmWidth = wm.width * scale;
    const wmHeight = wm.height * scale;

    const x = (doc.page.width - wmWidth) / 2;
    const y = (doc.page.height - wmHeight) / 2;

    doc.save()
      .opacity(0.15)
      .image(wm, x, y, { width: wmWidth })
      .opacity(1)
      .restore();
  } catch (err) {
    console.error("⚠ Error dibujando marca de agua:", err.message);
  }
}

// -------------------------------------------
//   UTIL: Dibujar imágenes sin romper PDF
// -------------------------------------------

async function dibujarEvidencias(doc, evidencias) {
  for (const ev of evidencias) {

    doc.fontSize(13).fillColor("#003366").text(`• ${ev.titulo || "Evidencia"}`);
    doc.moveDown(0.5);

    try {
      const buffer = await procesarImagen(ev.archivoUrl);

      if (!buffer) {
        doc.fillColor("red").text("(No se pudo cargar la imagen)");
        continue;
      }

      const img = doc.openImage(buffer);

      // Saltar de página si no cabe
      if (doc.y + img.height > doc.page.height - 80) {
        doc.addPage();
        // agregar marca de agua también aquí
        const watermarkPath = path.join(__dirname, "../public/watermark.png");
        dibujarMarcaAgua(doc, watermarkPath);
      }

      const x = (doc.page.width - img.width) / 2;
      doc.image(buffer, x, doc.y);

      doc.moveDown(1.5);

    } catch (err) {
      console.error("⚠ Error insertando evidencia:", err.message);
      doc.text("(Error al insertar imagen)");
      doc.moveDown(1);
    }
  }
}

// -------------------------------------------
//          CONTROLADOR GENERAR PDF
// -------------------------------------------
exports.generateReportePDF = async (req, res) => {
  const { tareaId } = req.params;

  try {
    // 1) Traer la tarea con todas sus relaciones
    const tarea = await Tarea.findByPk(tareaId, {
      include: [
        { model: Actividad },
        { model: Sucursal },
        { model: ClienteNegocio },
        { model: Usuario, as: "AsignadoA" },
        { model: Evidencia }
      ]
    });

    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    const evidencias = tarea.Evidencia || [];

    if (!evidencias.length) {
      return res
        .status(400)
        .json({ message: "La tarea no tiene evidencias para generar el PDF" });
    }

    // 2) Crear doc PDF
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Reporte_Tarea_${tarea.id}.pdf"`
    );

    doc.pipe(res);

    // 3) Logo y marca de agua (desde /public)
    const logoPath = path.join(__dirname, "..", "..", "public", "logo.png");
    const watermarkPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "watermark.png"
    );

    let logoImg = null;
    let watermarkImg = null;

    try {
      logoImg = doc.openImage(logoPath);
    } catch (e) {
      console.log("⚠ No se pudo cargar el logo:", e.message);
    }

    try {
      watermarkImg = doc.openImage(watermarkPath);
    } catch (e) {
      console.log("⚠ No se pudo cargar la marca de agua:", e.message);
    }

    const drawWatermark = () => {
      if (!watermarkImg) return;

      doc.save();
      doc.opacity(0.07);

      const w = watermarkImg.width;
      const h = watermarkImg.height;

      const scale = Math.min(
        (doc.page.width * 0.7) / w,
        (doc.page.height * 0.7) / h
      );

      const imgW = w * scale;
      const imgH = h * scale;

      doc.image(
        watermarkImg,
        (doc.page.width - imgW) / 2,
        (doc.page.height - imgH) / 2,
        { width: imgW, height: imgH }
      );

      doc.restore();
    };

    // Marca de agua en todas las páginas
    drawWatermark();
    doc.on("pageAdded", drawWatermark);

    // 4) ENCABEZADO
    if (logoImg) {
      doc.image(logoImg, 50, 40, { width: 110 });
    }

    doc
      .fillColor("#004b85")
      .fontSize(22)
      .text("AE TECH", 180, 40);

    doc
      .fontSize(10)
      .fillColor("#555")
      .text("Reporte oficial de servicio", 180, 65);

    doc.moveDown(3);

    // 5) Título principal + datos de la tarea
    doc
      .fontSize(18)
      .fillColor("#000")
      .text("Trabajo realizado: ", { continued: true })
      .fontSize(18)
      .text(tarea.nombre || "");

    doc.moveDown(1);

    doc
      .fontSize(16)
      .fillColor("#004b85")
      .text("Detalles del servicio", { underline: true });

    doc.moveDown(0.7);
    doc.fontSize(12).fillColor("#000");

    const cliente = tarea.ClienteNegocio;
    const sucursal = tarea.Sucursal;
    const actividad = tarea.Actividad;
    const asignado = tarea.AsignadoA;

    doc.text(`Cliente: ${cliente?.nombre || "-"}`);
    doc.text(`Dirección del Cliente: ${cliente?.direccion || "-"}`);
    doc.text(`Sucursal: ${sucursal?.nombre || "-"}`);
    doc.text(`Dirección de la Sucursal: ${sucursal?.direccion || "-"}`);
    doc.text(`Actividad: ${actividad?.nombre || "-"}`);
    doc.text(
      `Asignado a: ${
        asignado ? `${asignado.nombre} (${asignado.rol || "Sin rol"})` : "-"
      }`
    );
    doc.text(`Fecha de finalización: ${tarea.fechaLimite || "-"}`);

    doc.moveDown(1.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor("#004b85")
      .stroke();
    doc.moveDown(1.5);

    // =====================================================
    // 6) EVIDENCIAS → 2 imágenes por fila, tamaño mediano
    // =====================================================
    doc.addPage();
    doc
      .fontSize(18)
      .fillColor("#004b85")
      .text("Evidencias recopiladas", { underline: true });
    doc.moveDown(1);

    const MAX_W = 220;
    const MAX_H = 220;
    const GAP_X = 20;
    const GAP_Y = 30;

    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const usableWidth = doc.page.width - marginLeft - marginRight;
    const columnWidth = (usableWidth - GAP_X) / 2;

    let col = 0; // 0 = izquierda, 1 = derecha
    let y = doc.y;
    let rowHeight = 0;

    for (const ev of evidencias) {
      if (!ev.archivoUrl) continue;

      try {
        const resp = await axios.get(ev.archivoUrl, {
          responseType: "arraybuffer"
        });

        const buffer = await sharp(resp.data)
          .rotate()
          .resize({
            width: MAX_W,
            height: MAX_H,
            fit: "inside",
            withoutEnlargement: true
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        const img = doc.openImage(buffer);

        const neededHeight = img.height + 30; // imagen + texto

        // Si no cabe en esta página, saltamos
        if (
          y + neededHeight >
          doc.page.height - doc.page.margins.bottom - 20
        ) {
          doc.addPage();
          doc
            .fontSize(18)
            .fillColor("#004b85")
            .text("Evidencias recopiladas (cont.)");
          doc.moveDown(1);

          y = doc.y;
          col = 0;
          rowHeight = 0;
        }

        const baseX = marginLeft + col * (columnWidth + GAP_X);
        const imgX = baseX + (columnWidth - img.width) / 2;

        // Dibuja imagen
        doc.image(buffer, imgX, y, { width: img.width });

        // Texto centrado debajo
        const captionY = y + img.height + 4;
        doc
          .fontSize(11)
          .fillColor("#000")
          .text(ev.titulo || "Evidencia", baseX, captionY, {
            width: columnWidth,
            align: "center"
          });

        rowHeight = Math.max(rowHeight, neededHeight);

        // Cambiar de columna / fila
        if (col === 0) {
          col = 1;
        } else {
          col = 0;
          y += rowHeight + GAP_Y;
          rowHeight = 0;
        }
      } catch (e) {
        console.log("⚠ Error cargando evidencia:", e.message);
        doc
          .fontSize(11)
          .fillColor("red")
          .text(
            `No se pudo cargar la evidencia ${ev.titulo || ""}`,
            { width: usableWidth }
          );
        doc.moveDown(0.5);
      }
    }

    // =====================================
    // 7) FIRMA DEL CLIENTE (en nueva página)
    // =====================================
    const evidenciaConFirma = evidencias.find(ev => ev.firmaClienteUrl);

    if (evidenciaConFirma?.firmaClienteUrl) {
      doc.addPage();
      doc
        .fontSize(18)
        .fillColor("#004b85")
        .text("Firma del cliente", { underline: true });
      doc.moveDown(1);

      try {
        const resp = await axios.get(evidenciaConFirma.firmaClienteUrl, {
          responseType: "arraybuffer"
        });

        const buffer = await sharp(resp.data)
          .rotate()
          .resize({
            width: 350,
            height: 250,
            fit: "inside",
            withoutEnlargement: true
          })
          .jpeg({ quality: 90 })
          .toBuffer();

        const img = doc.openImage(buffer);
        const imgX = (doc.page.width - img.width) / 2;

        doc.image(buffer, imgX, doc.y);
      } catch (e) {
        console.log("⚠ Error cargando firma:", e.message);
        doc
          .fontSize(11)
          .fillColor("red")
          .text("No se pudo cargar la firma del cliente.");
      }
    }

    // =====================================
    // 8) MATERIALES OCUPADOS (tabla simple)
    // =====================================
    const materialesRaw = evidencias
      .filter(ev => Array.isArray(ev.materiales))
      .flatMap(ev => ev.materiales);

    if (materialesRaw.length) {
      // Agrupar por categoria + insumo + unidad
      const acumulados = {};

      for (const m of materialesRaw) {
        const key = `${m.categoria}||${m.insumo}||${m.unidad}`;
        const cant = Number(m.cantidad || 0);
        acumulados[key] = (acumulados[key] || 0) + cant;
      }

      const materiales = Object.entries(acumulados).map(([key, cantidad]) => {
        const [categoria, insumo, unidad] = key.split("||");
        return { categoria, insumo, unidad, cantidad };
      });

      const porCategoria = {};
      for (const m of materiales) {
        if (!porCategoria[m.categoria]) porCategoria[m.categoria] = [];
        porCategoria[m.categoria].push(m);
      }

      doc.addPage();
      doc
        .fontSize(18)
        .fillColor("#004b85")
        .text("Material ocupado", { underline: true });
      doc.moveDown(1);

      const categoriasOrdenadas = Object.keys(porCategoria).sort();

      for (const cat of categoriasOrdenadas) {
        doc
          .fontSize(14)
          .fillColor("#004b85")
          .text(`• ${cat}`);
        doc.moveDown(0.2);

        porCategoria[cat]
          .sort((a, b) => a.insumo.localeCompare(b.insumo))
          .forEach(m => {
            doc
              .fontSize(12)
              .fillColor("#000")
              .text(`${m.insumo} — ${m.cantidad} ${m.unidad}`, {
                indent: 20
              });
          });

        doc.moveDown(0.8);
      }
    }

    // 9) Terminar documento
    doc.end();
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error al generar el PDF" });
    }
  }
};
