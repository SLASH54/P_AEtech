const Contrato = require("../models/Contrato");
const PDFDocument = require("pdfkit");
const axios = require("axios");

// Función para cargar el fondo
async function cargarFondo(url) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return res.data;
    } catch (err) { 
        console.error("❌ No se pudo cargar la plantilla:", err.message);
        return null; 
    }
}

exports.generarPDFContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const contrato = await Contrato.findByPk(id);
        if (!contrato) return res.status(404).json({ msg: "Contrato no encontrado" });

        // 1. CARGAR LA PLANTILLA ANTES DE EMPEZAR EL DOC
        const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";
        const plantillaBuf = await cargarFondo(plantillaURL);

        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Contrato_AEtech_${contrato.cliente_nombre}.pdf`);
        doc.pipe(res);

        // --- FUNCIÓN PARA PONER EL FONDO ---
        // Se llama al inicio y cada vez que agregues una página nueva
        const ponerFondo = () => {
            if (plantillaBuf) {
                doc.image(plantillaBuf, 0, 0, { width: 612, height: 792 }); // Tamaño Carta
            }
        };

        // Ponemos el fondo en la primera hoja
        ponerFondo();

        // --- ENCABEZADO ---
        doc.fontSize(10).font('Helvetica-Bold').text("AE TECH", { align: 'right' });
        doc.fontSize(8).font('Helvetica').text("Seguridad, Tecnología e Innovación", { align: 'right' });
        doc.moveDown(1.5);

        // --- TÍTULO ---
        doc.fontSize(11).font('Helvetica-Bold').text("CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS", { align: 'center' });
        doc.moveDown();

        // --- CONTENIDO LEGAL ---
        doc.fontSize(9).font('Helvetica').fillColor("black");

        // Texto de introducción
        doc.text(`Contrato por prestación de servicios especializados de instalación... (tu texto completo aquí)`, { align: 'justify', lineGap: 2 });
        doc.moveDown();

        // Título Declaraciones
        doc.font('Helvetica-Bold').text("DECLARACIONES", { align: 'center' });
        doc.moveDown(0.5);
        doc.font('Helvetica').text(`1.- Declara “la prestadora” ser una persona física... (etc)`, { align: 'justify', lineGap: 2 });
        doc.moveDown();

        // Título Cláusulas
        doc.font('Helvetica-Bold').text("CLAUSULAS", { align: 'center' });
        doc.moveDown(0.5);
        doc.font('Helvetica').text(`Primera. “La prestadora” se obliga... (etc)`, { align: 'justify', lineGap: 2 });
        doc.moveDown(2);

        const fechaHoy = new Date().toLocaleDateString();
        doc.text(`Leído que fue el presente contrato... el día ${fechaHoy}.`, { align: 'justify' });

        // --- SECCIÓN DE FIRMAS ---
        if (doc.y > 550) {
            doc.addPage();
            ponerFondo(); // Poner fondo si se crea hoja nueva
        } else {
            doc.moveDown(4);
        }

        const yFirmas = doc.y;

        // Firma Cliente
        if (contrato.firma_base64) {
            const base64Data = contrato.firma_base64.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(base64Data, 'base64'), 70, yFirmas - 50, { width: 130 });
        }
        doc.moveTo(60, yFirmas).lineTo(230, yFirmas).stroke();
        doc.font('Helvetica-Bold').text("LA CONTRATANTE", 60, yFirmas + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text(contrato.cliente_nombre, 60, yFirmas + 15, { width: 170, align: 'center' });

        // Firma AE Tech
        doc.font('Courier-BoldOblique').fillColor("#000080").text("Denisse Avila E.", 350, yFirmas - 20, { width: 170, align: 'center' });
        doc.fillColor("black");
        doc.moveTo(350, yFirmas).lineTo(520, yFirmas).stroke();
        doc.font('Helvetica-Bold').text("PRESTADOR DE SERVICIOS", 350, yFirmas + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text("AE Tech", 350, yFirmas + 15, { width: 170, align: 'center' });

        doc.end();
    } catch (error) {
        console.error("❌ Error en PDF:", error);
        res.status(500).send("Error al generar contrato");
    }
};