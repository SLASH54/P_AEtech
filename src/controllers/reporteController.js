const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const { Tarea, Actividad, ClienteNegocio, Usuario, Evidencia, ClienteDireccion } = require("../models/relations");

// 1. Procesamiento de imágenes de alta calidad
async function procesarImagen(url, maxW, maxH, isSignature = false) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        let pipeline = sharp(res.data).rotate();

        if (isSignature) {
            pipeline = pipeline.png({ compressionLevel: 9 });
        } else {
            pipeline = pipeline.jpeg({ 
                quality: 95, 
                chromaSubsampling: '4:4:4',
                force: true 
            });
        }

        return await pipeline
            .resize({ width: maxW, height: maxH, fit: "inside", withoutEnlargement: true })
            .toBuffer();
    } catch (err) {
        console.error("⚠ Error imagen:", err.message);
        return null;
    }
}

exports.generarPDFTarea = async (req, res) => {
    const MARGIN_LEFT = 55;
    const { id } = req.params;

    try {
        // Consultar Tarea con Evidencias ORDENADAS por fecha
        const tarea = await Tarea.findByPk(id, {
            include: [
                { model: Actividad, as: "actividad" },
                { model: ClienteNegocio, as: "clienteNegocio" },
                { model: ClienteDireccion, as: "clienteDireccion" },
                { model: Usuario, as: "usuario" },
                { 
                    model: Evidencia, 
                    as: "evidencias",
                    separate: true,
                    order: [['createdAt', 'ASC']] // <--- Aquí arreglamos el orden
                }
            ],
        });

        if (!tarea) return res.status(404).send("Tarea no encontrada");

        const doc = new PDFDocument({ size: "LETTER", margin: 0 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Reporte_Tarea_${id}.pdf`);
        doc.pipe(res);

        // --- ENCABEZADO ESTILO LEVANTAMIENTOS ---
        doc.rect(0, 0, 612, 120).fill("#00938f");
        doc.fillColor("white").fontSize(22).text("REPORTE DE TAREA", MARGIN_LEFT, 45);
        doc.fontSize(10).text(`FOLIO: T-${tarea.id.toString().padStart(4, '0')}`, MARGIN_LEFT, 75);

        // --- BLOQUE DE INFORMACIÓN GENERAL ---
        doc.fillColor("black").fontSize(14).text("DATOS GENERALES", MARGIN_LEFT, 140);
        doc.rect(MARGIN_LEFT, 160, 500, 2).fill("#00938f");
        
        doc.moveDown(2);
        doc.fillColor("#333").fontSize(11);
        
        const infoY = 180;
        doc.font('Helvetica-Bold').text("Cliente:", MARGIN_LEFT, infoY);
        doc.font('Helvetica').text(tarea.clienteNegocio?.nombre || "N/A", MARGIN_LEFT + 70, infoY);
        
        doc.font('Helvetica-Bold').text("Fecha:", MARGIN_LEFT + 300, infoY);
        doc.font('Helvetica').text(new Date(tarea.createdAt).toLocaleDateString(), MARGIN_LEFT + 350, infoY);

        doc.font('Helvetica-Bold').text("Dirección:", MARGIN_LEFT, infoY + 20);
        doc.font('Helvetica').text(tarea.clienteDireccion?.nombre || "Sin dirección", MARGIN_LEFT + 70, infoY + 20);

        doc.font('Helvetica-Bold').text("Técnico:", MARGIN_LEFT, infoY + 40);
        doc.font('Helvetica').text(tarea.usuario?.nombre || "No asignado", MARGIN_LEFT + 70, infoY + 40);

        // --- DESCRIPCIÓN ---
        doc.moveDown(4);
        doc.fontSize(14).fillColor("#00938f").text("DESCRIPCIÓN DEL TRABAJO");
        doc.moveDown(0.5);
        doc.fillColor("#000").fontSize(11).font('Helvetica').text(tarea.descripcion || "Sin descripción.", { align: 'justify', width: 500 });

        // --- SECCIÓN DE EVIDENCIAS (FOTOS) ---
        const fotosEvidencia = tarea.evidencias.filter(e => e.fotoUrl && !e.firmaClienteUrl);
        
        if (fotosEvidencia.length > 0) {
            doc.addPage();
            // Encabezado de página de fotos
            doc.rect(0, 0, 612, 50).fill("#00938f");
            doc.fillColor("white").fontSize(16).text("EVIDENCIAS FOTOGRÁFICAS", MARGIN_LEFT, 18);

            doc.moveDown(3);
            
            for (const foto of fotosEvidencia) {
                if (doc.y > 500) { // Si ya no cabe, nueva página
                    doc.addPage();
                    doc.rect(0, 0, 612, 50).fill("#00938f");
                    doc.fillColor("white").fontSize(16).text("EVIDENCIAS FOTOGRÁFICAS (CONT.)", MARGIN_LEFT, 18);
                    doc.moveDown(3);
                }

                const imgBuffer = await procesarImagen(foto.fotoUrl, 450, 300);
                if (imgBuffer) {
                    doc.image(imgBuffer, { fit: [450, 250], align: 'center' });
                    if (foto.comentario) {
                        doc.moveDown(0.5);
                        doc.fillColor("#666").fontSize(10).italic().text(`Nota: ${foto.comentario}`, { align: 'center' });
                    }
                    doc.moveDown(2);
                }
            }
        }

        // --- SECCIÓN DE FIRMA ---
        const firma = tarea.evidencias.find(e => e.firmaClienteUrl);
        if (firma) {
            doc.addPage();
            doc.rect(0, 0, 612, 50).fill("#00938f");
            doc.fillColor("white").fontSize(16).text("VALIDACIÓN Y FIRMA", MARGIN_LEFT, 18);
            
            doc.moveDown(8);
            const firmaBuf = await procesarImagen(firma.firmaClienteUrl, 300, 200, true);
            if (firmaBuf) {
                doc.image(firmaBuf, { fit: [300, 150], align: 'center' });
                doc.moveDown(1);
                doc.fillColor("black").fontSize(12).text("__________________________", { align: 'center' });
                doc.text("Firma de Conformidad", { align: 'center' });
            }
        }

        doc.end();
    } catch (err) {
        console.error("Error PDF:", err);
        res.status(500).send("Error al generar el reporte");
    }
};