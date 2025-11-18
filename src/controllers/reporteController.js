const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path");

exports.generateReportePDF = async (req, res) => {
  try {
    const tarea = req.body.tarea;
    const evidencias = req.body.evidencias || [];
    const materiales = req.body.materiales || [];

    // === Crear documento PDF ===
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Reporte_Tarea_${tarea.id}.pdf`);

    doc.pipe(res);

    // ==== RUTAS A LOGO Y WATERMARK ====
    const logoPath = path.join(__dirname, "..", "public", "logo.png");
    const watermarkPath = path.join(__dirname, "..", "public", "watermark.png");

    // ==== ENCABEZADO POR CADA PÁGINA ====
    const drawHeader = () => {
      doc.image(logoPath, 40, 20, { width: 80 });
      doc.fontSize(14).fillColor("#003366").text("AE TECH", 130, 25);
      doc.fontSize(10).fillColor("gray").text("Reporte oficial de servicio", 130, 42);

      doc.moveTo(40, 70)
        .lineTo(doc.page.width - 40, 70)
        .stroke("#003366");

      // Marca de agua
      doc.opacity(0.08)
        .image(watermarkPath, doc.page.width / 4, 150, { width: 300 })
        .opacity(1);
    };

    doc.on("pageAdded", drawHeader);

    // ==== PRIMERA PÁGINA ====
    drawHeader();
    doc.moveDown(3);

    // ==== TITULO ====
    doc.fontSize(18).fillColor("#003366").text("Trabajo Realizado:", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor("black").text(`${tarea?.titulo || "Sin título"}`);
    doc.moveDown(1);

    // ==== DETALLES DEL SERVICIO ====
    doc.fontSize(16).fillColor("#003366").text("Detalles del servicio");
    doc.moveTo(40, doc.y + 3).lineTo(doc.page.width - 40, doc.y + 3).stroke("#003366");
    doc.moveDown(1);

    const sucNombre = tarea?.sucursal?.nombre || "N/A";
    const sucDir = tarea?.sucursal?.direccion || "Sin dirección";

    doc.fontSize(11).fillColor("black");
    doc.text(`Cliente: ${tarea?.clienteNombre || "N/A"}`);
    doc.text(`Dirección del Cliente: ${tarea?.direccionCliente || "N/A"}`);
    doc.text(`Sucursal: ${sucNombre} — ${sucDir}`);
    doc.text(`Actividad: ${tarea?.actividad || "N/A"}`);
    doc.text(`Asignado a: ${tarea?.asignadoA || "N/A"}`);
    doc.text(`Fecha de finalización: ${tarea?.fechaFinalizacion || "Sin fecha"}`);
    doc.moveDown(2);

    // ==== SECCIÓN DE EVIDENCIAS ====
    doc.fontSize(16).fillColor("#003366").text("Evidencias Recopiladas");
    doc.moveTo(40, doc.y + 3).lineTo(doc.page.width - 40, doc.y + 3).stroke("#003366");
    doc.moveDown(1);

    const MAX_WIDTH = 420;   // Perfecto para carta vertical
    const MAX_HEIGHT = 530;  // Evita cortes y saltos raros

    for (const ev of evidencias) {
      doc.fontSize(12).fillColor("black").text(`• ${ev.titulo || "Evidencia"}`);
      doc.moveDown(0.4);

      try {
        // Descargar imagen
        const resp = await axios.get(ev.archivoUrl, { responseType: "arraybuffer" });

        // Procesar con sharp
        const buffer = await sharp(resp.data)
          .rotate()
          .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        const img = doc.openImage(buffer);

        // Salto de página si no cabe
        if (doc.y + img.height > doc.page.height - 100) {
          doc.addPage();
        }

        // Centrar imagen
        const x = (doc.page.width - img.width) / 2;

        doc.image(buffer, x, doc.y);
        doc.moveDown(1.5);

      } catch (err) {
        console.log("Error cargando imagen:", ev.archivoUrl, err.message);
        doc.fillColor("red").text("⚠ No se pudo cargar la imagen.");
        doc.moveDown(1);
      }
    }

    // ==== SECCIÓN DE MATERIALES ====
    if (materiales.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor("#003366").text("Material Ocupado");
      doc.moveTo(40, doc.y + 3).lineTo(doc.page.width - 40, doc.y + 3).stroke("#003366");
      doc.moveDown(1);

      materiales.forEach(m => {
        doc.fontSize(12).fillColor("black").text(`• ${m.insumo} — ${m.cantidad} ${m.unidad}`);
      });
    }

    // === FINALIZAR PDF ===
    doc.end();

  } catch (err) {
    console.log("ERROR PDF:", err);
    res.status(500).json({ error: "No se pudo generar el PDF." });
  }
};
