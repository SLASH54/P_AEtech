const Contrato = require("../models/Contrato");
const PDFDocument = require("pdfkit");
const axios = require("axios");

// Función para cargar el fondo (reutilizada de tus levantamientos)
async function cargarFondo(url) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return res.data;
    } catch (err) { return null; }
}

exports.generarPDFContrato = async (req, res) => {
    const MARGIN_TOP = 170; 
    const MARGIN_LEFT = 60;

    try {
        const { id } = req.params;
        const contrato = await Contrato.findByPk(id);
        if (!contrato) return res.status(404).json({ msg: "Contrato no encontrado" });

        // Usamos tu plantilla oficial de AE Tech
        const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";
        const plantillaBuf = await cargarFondo(plantillaURL);

        const doc = new PDFDocument({ margin: 50, bufferPages: true });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Contrato_${contrato.clienteNombre}.pdf`);
        doc.pipe(res);

        // Función para aplicar el fondo en cada página
        const aplicarFondo = () => {
            if (plantillaBuf) {
                doc.image(plantillaBuf, 0, 0, { width: doc.page.width, height: doc.page.height });
            }
            doc.y = MARGIN_TOP; 
        };

        aplicarFondo();

        // --- TÍTULO ---
        doc.fontSize(18).fillColor("#004b85").font('Helvetica-Bold')
           .text("CONTRATO DE PRESTACIÓN DE SERVICIOS", { align: 'center' });
        doc.moveDown(2);

        // --- CUERPO DEL CONTRATO ---
        doc.fontSize(11).fillColor("black").font('Helvetica');
        
        const textoContrato = `Por medio del presente, se hace constar el acuerdo entre AE Tech y el cliente ${contrato.clienteNombre}, con RFC ${contrato.clienteRFC || 'S/N'}, para la prestación de servicios de seguridad y tecnología por un monto total de $${contrato.monto}.`;

        doc.text(textoContrato, { align: 'justify', lineGap: 5 });
        doc.moveDown(2);

        // --- SECCIÓN DE FIRMAS ---
        // Si el contrato ya tiene la URL de la firma de Cloudinary, la ponemos
        if (contrato.contratoFirmaUrl) {
            try {
                const resFirma = await axios.get(contrato.contratoFirmaUrl, { responseType: "arraybuffer" });
                doc.image(resFirma.data, MARGIN_LEFT, doc.y, { width: 150 });
            } catch (e) {
                doc.text("__________________________", MARGIN_LEFT, doc.y + 40);
            }
        } else {
            doc.moveDown(4);
            doc.text("__________________________", MARGIN_LEFT, doc.y);
        }

        doc.text("FIRMA DEL CLIENTE", MARGIN_LEFT, doc.y + 10);

        doc.end();
    } catch (error) {
        console.error("Error PDF Contrato:", error);
        res.status(500).send("Error al generar el contrato");
    }
};