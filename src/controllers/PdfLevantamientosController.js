const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const { Levantamiento } = require("../models"); // Ajusta según tu ruta de modelos

// Configuración de márgenes según tu plantilla
const MARGIN_TOP = 180;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const GAP = 30;

// Función para cargar imagen desde URL
async function cargarImagen(url) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return res.data;
    } catch (err) {
        console.error("⚠ Error cargando imagen:", url, err.message);
        return null;
    }
}

// Función para procesar imágenes de evidencias/necesidades
async function procesarImagen(url, maxW, maxH) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return await sharp(res.data)
            .rotate()
            .resize({ width: maxW, height: maxH, fit: "inside" })
            .toBuffer();
    } catch (err) {
        return null;
    }
}

function aplicarPlantilla(doc, buffer) {
    if (buffer) {
        doc.image(buffer, 0, 0, { width: doc.page.width, height: doc.page.height });
    }
    doc.y = MARGIN_TOP;
}

exports.generateLevantamientoPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const lev = await Levantamiento.findByPk(id);

        if (!lev) return res.status(404).json({ msg: "Levantamiento no encontrado" });

        const doc = new PDFDocument({ margin: 0, bufferPages: true });
        const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";
        const plantillaBuf = await cargarImagen(plantillaURL);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Levantamiento_${id}.pdf`);
        doc.pipe(res);

        // --- PÁGINA 1: DATOS GENERALES ---
        aplicarPlantilla(doc, plantillaBuf);

        doc.moveDown(2);
        doc.fontSize(22).fillColor("#00938f").text("REPORTE DE LEVANTAMIENTO", MARGIN_LEFT);
        doc.moveDown(1);

        doc.fontSize(14).fillColor("#000");
        doc.text(`Folio: #LEV-${lev.id}`, { continued: true }).text(`  |  Fecha: ${lev.fecha}`, { align: 'right' });
        doc.moveDown(0.5);
        doc.text(`Cliente: ${lev.cliente_nombre}`);
        doc.text(`Dirección: ${lev.direccion}`);
        doc.text(`Personal encargado: ${lev.personal}`);
        
        doc.moveDown(2);
        doc.fontSize(18).fillColor("#004b85").text("NECESIDADES IDENTIFICADAS");
        doc.moveDown(1);

        // --- RENDERIZAR NECESIDADES (FOTOS Y TEXTO) ---
        const MAX_W = 240;
        const MAX_H = 200;
        let col = 0;
        let yPos = doc.y;

        if (lev.necesidades && lev.necesidades.length > 0) {
            for (const nec of lev.necesidades) {
                // Verificar si necesitamos nueva página antes de dibujar
                if (yPos + MAX_H > doc.page.height - 100) {
                    doc.addPage();
                    aplicarPlantilla(doc, plantillaBuf);
                    yPos = MARGIN_TOP + 20;
                }

                const x = col === 0 ? MARGIN_LEFT : (doc.page.width / 2) + 10;
                
                // Texto de la descripción
                doc.fontSize(11).fillColor("#333").text(nec.descripcion, x, yPos, { width: MAX_W });
                
                // Imagen
                if (nec.imagen) {
                    const imgBuf = await procesarImagen(nec.imagen, MAX_W, MAX_H);
                    if (imgBuf) {
                        doc.image(imgBuf, x, doc.y + 5, { width: MAX_W });
                    }
                }

                if (col === 0) {
                    col = 1;
                } else {
                    col = 0;
                    yPos = doc.y + GAP + 20; // Espacio para la siguiente fila
                }
            }
        }

        // --- SECCIÓN DE MATERIALES ---
        if (lev.materiales && lev.materiales.length > 0) {
            doc.addPage();
            aplicarPlantilla(doc, plantillaBuf);
            doc.moveDown(2);
            doc.fontSize(20).fillColor("#00938f").text("MATERIAL REQUERIDO ESTIMADO", MARGIN_LEFT);
            doc.moveDown(1);

            lev.materiales.forEach(m => {
                doc.fontSize(12).fillColor("#000")
                   .text(`• ${m.insumo}`, { continued: true, indent: 20 })
                   .fillColor("#666")
                   .text(` — Cantidad: ${m.cantidad} ${m.unidad}`);
                doc.moveDown(0.5);
            });
        }

        doc.end();
    } catch (error) {
        console.error("Error PDF Levantamiento:", error);
        res.status(500).send("Error al generar el PDF del levantamiento");
    }
};