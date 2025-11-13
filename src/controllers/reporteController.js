const PDFDocument = require('pdfkit'); 
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Tarea, Actividad, Sucursal, ClienteNegocio, Evidencia, Usuario } = require('../models/relations');

const publicDir = path.join(__dirname, '..', 'public');


exports.generateReportePDF = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const id = typeof tareaId === 'object' ? tareaId.tareaId : tareaId;

    const tarea = await Tarea.findByPk(Number(id), {
      include: [
        { model: Actividad, attributes: ['nombre', 'descripcion'] },
        { model: Sucursal, attributes: ['nombre', 'direccion'] },
        { model: ClienteNegocio, attributes: ['nombre', 'direccion'] },
        { model: Usuario, as: 'AsignadoA', attributes: ['nombre', 'rol'] },
        { model: Evidencia, attributes: ['titulo', 'archivoUrl', 'firmaClienteUrl', 'createdAt', 'materiales'] }
      ]
    });

    if (!tarea) return res.status(404).json({ message: `No se encontró la tarea con ID ${id}` });

    // -----------------------------
    // 📄 CONFIG PDF
    // -----------------------------
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Reporte_Tarea_${id}.pdf"`);

    const doc = new PDFDocument({
      margin: 40,
      size: "A4"
    });
    doc.pipe(res);


    // =============================
    // MARCA DE AGUA GLOBAL (TODAS LAS PÁGINAS)
    // =============================
    function drawWatermark() {
      try {
        const watermarkPath = path.join(__dirname, "..", "..", "public", "watermark.png");
        if (fs.existsSync(watermarkPath)) {

          const pageWidth = doc.page.width;
          const pageHeight = doc.page.height;

          doc.save();
          doc.opacity(0.25); // 👈 Más visible pero no molesta
          doc.image(
            watermarkPath,
            pageWidth / 2 - 300,   // centrado
            pageHeight / 2 - 300,  // centrado
            { width: 600 }         // 👈 Más grande
          );
          doc.restore();
        }
      } catch (e) {
        console.log("Error watermark:", e.message);
      }
    }

    // Dibujar marca en la primera página
    drawWatermark();

    // Dibujar marca automáticamente en TODAS las páginas nuevas
    doc.on("pageAdded", drawWatermark);

    

    // -----------------------------
    // 🔵 ENCABEZADO CORPORATIVO 2.0
    // -----------------------------
    const logoPath = path.join(__dirname, "..", "..", "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 35, { width: 80 });
    }

    doc.fontSize(22).fillColor("#003366").text("AE TECH", 140, 40);
    doc.fontSize(12).fillColor("#777").text("Reporte oficial de servicio", 140, 65);

    doc.moveTo(40, 90).lineTo(550, 90).stroke("#003366");

    doc.moveDown(2);

    // -----------------------------
    // 🔵 DATOS DE LA TAREA
    // -----------------------------
    doc.fontSize(17).fillColor("#003366");
    doc.text(`Trabajo Realizado: ${tarea.nombre}`);
    doc.moveDown();
    doc.fontSize(17).fillColor("#003366").text("Detalles del servicio", { underline: true });
    doc.moveDown();

    doc.fontSize(12).fillColor("#222");
    doc.text(`Cliente: ${tarea.ClienteNegocio.nombre}`);
    doc.text(`Dirección: ${tarea.ClienteNegocio.direccion}`);
    doc.text(`Sucursal: ${tarea.Sucursal.nombre}`);
    doc.text(`Actividad: ${tarea.Actividad.nombre}`);
    doc.text(`Asignado a: ${tarea.AsignadoA.nombre} (${tarea.AsignadoA.rol})`);
    doc.text(`Fecha de finalización: ${tarea.createdAt.toLocaleDateString()}`);

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#cccccc");
    doc.moveDown(1.5);

    // -----------------------------
    // 🖼️ EVIDENCIAS
    // -----------------------------
    doc.fontSize(17).fillColor("#003366").text("Evidencias Recopiladas", { underline: true });
    doc.moveDown(1);
    
    for (const ev of evidencias) {

      // Título de la evidencia
      doc.fontSize(12).fillColor("black").text(`• ${ev.titulo || "Evidencia"}`, { underline: false });
      doc.moveDown(0.5);

      // Cargar imagen desde URL o ruta
      try {
        const response = await axios.get(ev.archivoUrl, { responseType: "arraybuffer" });
        const imgBuffer = Buffer.from(response.data, "binary");

        // Obtener dimensiones originales
        const img = doc.openImage(imgBuffer);
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Ancho máximo permitido
        const maxWidth = 400; // ajusta si quieres más ancho
        const scale = maxWidth / originalWidth;

        const displayWidth = originalWidth * scale;
        const displayHeight = originalHeight * scale;

        // Si no cabe => nueva página
        if (doc.y + displayHeight > doc.page.height - 80) {
          doc.addPage(); // tu marca de agua ya aparece por pageAdded
          doc.moveDown(1);
        }

        // Dibujar imagen con tamaño ajustado
        doc.image(imgBuffer, {
          fit: [maxWidth, displayHeight],
          align: "center"
        });

        doc.moveDown(1.5);

      } catch (e) {
        console.log("Error cargando imagen:", ev.archivoUrl, e.message);
        doc.text("(Imagen no disponible)");
      }
    }


    // -----------------------------
    // ✍️ FIRMA DEL CLIENTE
    // -----------------------------
    const evFirma = tarea.Evidencia.find(ev => ev.firmaClienteUrl);

    if (evFirma?.firmaClienteUrl) {
      doc.addPage();

      doc.fontSize(18).fillColor("#003366").text("Firma del Cliente", { align: "center", underline: true });
      doc.moveDown(1);

      try {
        const respFirma = await axios.get(evFirma.firmaClienteUrl, { responseType: "arraybuffer" });
        const firmaBuffer = Buffer.from(respFirma.data);
        doc.image(firmaBuffer, { width: 280, align: "center" });
      } catch {
        doc.fillColor("gray").text("(No se pudo cargar la firma)", { align: "center" });
      }

      doc.moveDown(2);
    }

    // -----------------------------
    // 🧱 MATERIALES
    // -----------------------------
    // Extraer materiales y agruparlos igual que en el frontend
    const materialesRaw = [];

    tarea.Evidencia.forEach(ev => {
      if (ev.materiales) {
        if (Array.isArray(ev.materiales)) materialesRaw.push(...ev.materiales);
        else {
          try { materialesRaw.push(...JSON.parse(ev.materiales)); }
          catch { console.log("Material inválido:", ev.materiales); }
        }
      }
    });

    if (materialesRaw.length > 0) {
      const grupos = {};
      materialesRaw.forEach(m => {
        if (!grupos[m.categoria]) grupos[m.categoria] = [];
        grupos[m.categoria].push(m);
      });

      const categoriasOrdenadas = Object.keys(grupos).sort();

      doc.addPage();

      doc.fontSize(18).fillColor("#003366").text("Material Ocupado", { underline: true, align: "center" });
      doc.moveDown(1);

      categoriasOrdenadas.forEach(cat => {
        doc.fontSize(15).fillColor("#444").text(`• ${cat}`);
        doc.moveDown(0.3);

        grupos[cat]
          .sort((a, b) => a.insumo.localeCompare(b.insumo))
          .forEach(m => {
            doc.fontSize(12).fillColor("#222").text(`   - ${m.insumo} — ${m.cantidad} ${m.unidad}`);
          });

        doc.moveDown(1);
      });
    }

    // -----------------------------
    // 🔵 FOOTER CORPORATIVO
    // -----------------------------
    doc.moveTo(40, 770).lineTo(550, 770).strokeColor("#003366");
    doc.fontSize(10).fillColor("#555");
    doc.text("AE TECH - Reporte Oficial · Sistema de Gestión Interna", 40, 780, { align: "center" });

    doc.end();

  } catch (err) {
    console.error("❌ Error PDF:", err);
    res.status(500).json({ message: "Error interno generando PDF" });
  }
};
