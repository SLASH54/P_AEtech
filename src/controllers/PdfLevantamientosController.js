// ===============================================================
//   LEVANTAMIENTOS PDF – VERSIÓN FIJADA (IGUAL A REPORTES)
// ===============================================================
const sharp = require("sharp"); // Asegúrate de tener sharp instalado amiko

// Reutilizamos tus funciones de alta calidad
async function procesarImagenLev(url, maxW, maxH) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return await sharp(res.data)
      .rotate() // Para que no salgan de lado
      .jpeg({ quality: 90 })
      .resize({ width: maxW, height: maxH, fit: "inside" })
      .toBuffer();
  } catch (err) {
    return null;
  }
}

async function cargarImagenSimple(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return res.data;
  } catch (err) { return null; }
}

exports.generateLevantamientoPDF = async (req, res) => {
  // Ajustamos los márgenes para que el texto caiga en el hueco blanco de tu plantilla
  const MARGIN_TOP = 180; 
  const MARGIN_LEFT = 50;

  try {
    const { id } = req.params;
    const lev = await Levantamiento.findByPk(id);
    if (!lev) return res.status(404).json({ msg: "No encontrado" });

    // URLs oficiales
    const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";
    const plantillaBuf = await cargarImagenSimple(plantillaURL);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Levantamiento_${id}.pdf`);
    doc.pipe(res);

    // Función para poner el fondo y resetear la posición del texto
    const aplicarPlantilla = () => {
      if (plantillaBuf) {
        doc.image(plantillaBuf, 0, 0, { width: doc.page.width, height: doc.page.height });
      }
      doc.y = MARGIN_TOP; // Esto hace que el texto empiece abajo del encabezado
    };

    // --- PÁGINA 1 ---
    aplicarPlantilla();

    // Título Principal
    doc.fontSize(22).fillColor("#00938f").text("INFORMACIÓN DEL LEVANTAMIENTO", MARGIN_LEFT);
    doc.moveDown(1);

    // Datos del Cliente y Sucursal (Sin Folio amiko)
    doc.fontSize(14).fillColor("black");
    doc.text(`Cliente: `, { continued: true }).font('Helvetica-Bold').text(lev.cliente_nombre);
    doc.font('Helvetica').text(`Sucursal/Dirección: `, { continued: true }).font('Helvetica-Bold').text(lev.direccion);
    doc.font('Helvetica').text(`Fecha: `, { continued: true }).font('Helvetica-Bold').text(new Date(lev.fecha).toLocaleDateString());
    doc.font('Helvetica').text(`Atendido por: `, { continued: true }).font('Helvetica-Bold').text(lev.personal);
    
    doc.moveDown(2);

    // --- EVIDENCIAS ---
    doc.fontSize(18).fillColor("#00938f").text("EVIDENCIAS Y NECESIDADES");
    doc.moveDown();

    if (lev.necesidades) {
      for (const nec of lev.necesidades) {
        // Si nos estamos quedando sin espacio abajo, nueva página
        if (doc.y > 600) {
          doc.addPage();
          aplicarPlantilla();
        }

        doc.fontSize(12).fillColor("#333").font('Helvetica-Bold').text(`• Descripción:`, { continued: true });
        doc.font('Helvetica').text(` ${nec.descripcion}`, { indent: 10 });
        doc.moveDown(0.5);
        
        if (nec.imagen) {
          // Procesamos con Sharp para máxima calidad
          const imgBuffer = await procesarImagenLev(nec.imagen, 450, 300);
          if (imgBuffer) {
            doc.image(imgBuffer, { width: 350, align: 'center' });
            doc.moveDown(1.5);
          }
        }
      }
    }

    // --- MATERIALES (En página nueva si hay muchos) ---
    if (lev.materiales && lev.materiales.length > 0) {
      doc.addPage();
      aplicarPlantilla();
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