const { Levantamiento } = require("../models");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");

// 1. Función para procesar imágenes con alta calidad (como en tus reportes)
async function procesarImagenLev(url, maxW, maxH) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return await sharp(res.data)
            .rotate() // Corregir orientación automática
            .jpeg({ quality: 90 }) // Alta calidad
            .resize({ width: maxW, height: maxH, fit: "inside" })
            .toBuffer();
    } catch (err) {
        console.error("Error imagen:", err.message);
        return null;
    }
}

// 2. Función para cargar la plantilla de fondo
async function cargarFondo(url) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return res.data;
    } catch (err) { return null; }
}


// =========================================================
//   GENERAR REPORTE PDF
// =========================================================

exports.generateLevantamientoPDF = async (req, res) => {
    // Margen para que el texto caiga justo en el área blanca de tu plantilla
    const MARGIN_TOP = 175; 
    const MARGIN_LEFT = 55;

    try {
        const { id } = req.params;
        const lev = await Levantamiento.findByPk(id);
        if (!lev) return res.status(404).json({ msg: "No encontrado" });

        // URL de tu plantilla que ya tiene el logo
        const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";
        const plantillaBuf = await cargarFondo(plantillaURL);

        const doc = new PDFDocument({ margin: 40, bufferPages: true });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Levantamiento_${id}.pdf`);
        doc.pipe(res);

        // Función para aplicar el fondo sin logos extras
        const nuevaPaginaConFondo = () => {
            if (plantillaBuf) {
                doc.image(plantillaBuf, 0, 0, { width: doc.page.width, height: doc.page.height });
            }
            doc.y = MARGIN_TOP; // Bajamos el cursor al área blanca
        };

        // --- PRIMERA PÁGINA ---
        nuevaPaginaConFondo();

        // Título limpio
        doc.fontSize(20).fillColor("#004b85").text("REPORTE DE LEVANTAMIENTO", MARGIN_LEFT, doc.y, { align: 'center' });
        doc.moveDown(1.5);

        // Datos del Cliente (Sin Folio LEV-48)
        doc.fontSize(12).fillColor("black");
        doc.font('Helvetica-Bold').text("Cliente: ", { continued: true }).font('Helvetica').text(lev.cliente_nombre);
        doc.font('Helvetica-Bold').text("Dirección: ", { continued: true }).font('Helvetica').text(lev.direccion);
        doc.font('Helvetica-Bold').text("Fecha: ", { continued: true }).font('Helvetica').text(new Date(lev.fecha).toLocaleDateString());
        doc.font('Helvetica-Bold').text("Técnico: ", { continued: true }).font('Helvetica').text(lev.personal);
        
        doc.moveDown(2);
        doc.moveTo(MARGIN_LEFT, doc.y).lineTo(550, doc.y).stroke("#00938f");
        doc.moveDown(1.5);

        // --- EVIDENCIAS ---
        doc.fontSize(16).fillColor("#00938f").text("NECESIDADES Y EVIDENCIAS");
        doc.moveDown();

        if (lev.necesidades) {
            for (const nec of lev.necesidades) {
                // Control de salto de página
                if (doc.y > 600) {
                    doc.addPage();
                    nuevaPaginaConFondo();
                }

                doc.fontSize(11).fillColor("#333").font('Helvetica-Bold').text(`• ${nec.descripcion}`);
                doc.moveDown(0.5);
                
                if (nec.imagen) {
                    const imgBuffer = await procesarImagenLev(nec.imagen, 400, 300);
                    if (imgBuffer) {
                        doc.image(imgBuffer, { width: 320, align: 'center' });
                        doc.moveDown(1.5);
                    }
                }
            }
        }

        // --- MATERIALES ---
        if (lev.materiales && lev.materiales.length > 0) {
            doc.addPage();
            nuevaPaginaConFondo();
            doc.fontSize(16).fillColor("#00938f").text(" MATERIALES REQUERIDOS");
            doc.moveDown();

            lev.materiales.forEach(m => {
                doc.fontSize(11).fillColor("black")
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


