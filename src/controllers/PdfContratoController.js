const Contrato = require("../models/Contrato");
const PDFDocument = require("pdfkit");
const axios = require("axios");

async function cargarFondo(url) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return res.data;
    } catch (err) { return null; }
}

exports.generarPDFContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const contrato = await Contrato.findByPk(id);
        if (!contrato) return res.status(404).json({ msg: "Contrato no encontrado" });

        const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";
        const plantillaBuf = await cargarFondo(plantillaURL);

        const doc = new PDFDocument({ margin: 70, size: 'LETTER' });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Contrato_AEtech_${contrato.clienteNombre}.pdf`);
        doc.pipe(res);

        const ponerFondo = () => {
            if (plantillaBuf) doc.image(plantillaBuf, 0, 0, { width: 612, height: 792 });
        };

        // --- HOJA 1 ---
        ponerFondo();
        doc.y = 160; 

        doc.fontSize(11).font('Helvetica-Bold').text("CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS", { align: 'center' });
        doc.moveDown(1.5);

        doc.fontSize(11).font('Helvetica').fillColor("black");

        // Texto del Contrato (Usando los nombres de campos de tu nuevo modelo)
        doc.text(`Contrato por prestación de servicios especializados... que celebran por una parte Denisse Avila Espinoza a quien en lo sucesivo se le denominara “la prestadora” y, por la otra parte la Persona Sr(a). ${contrato.clienteNombre}, con RFC ${contrato.clienteRFC || '___________'}, a quien se le denominara “la contratante”...`, { align: 'justify', lineGap: 2 });
        
        doc.moveDown();
        doc.font('Helvetica-Bold').text("DECLARACIONES", { align: 'center' });
        doc.moveDown(0.5);

        // ... (Aquí puedes mantener tus declaraciones como las tenías) ...
        const declaraciones = [
            `1.- Declara “la prestadora” ser una persona física... con clave: AIED011026T79...`,
            `2.- Declara “la prestadora” que su actividad es... sistemas de seguridad electrónica...`,
            // ... resto de declaraciones
        ];

        declaraciones.forEach(texto => {
            doc.font('Helvetica').text(texto, { align: 'justify', lineGap: 1 });
            doc.moveDown(0.4);
        });

        if (doc.y > 600) { doc.addPage(); ponerFondo(); doc.y = 160; }

        doc.moveDown();
        doc.font('Helvetica-Bold').text("CLAUSULAS", { align: 'center' });
        doc.moveDown(0.5);

        // ... (Tus cláusulas actuales) ...
        doc.font('Helvetica').text(`Primera a Décima...`, { align: 'justify' });

        // --- SECCIÓN DE FIRMAS ---
        // Aseguramos que no se corte la firma al final de la página
        if (doc.y > 550) { doc.addPage(); ponerFondo(); doc.y = 160; }

        doc.moveDown(3);
        const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.font('Helvetica').text(`Firma de conformidad en la ciudad de Atlixco, Puebla, el día ${hoy}.`, { align: 'center' });

        doc.moveDown(5);
        const yBaseLineas = doc.y; // Punto de referencia para las líneas

        // --- PROCESAR FIRMA CLIENTE (Izquierda) ---
        if (contrato.firmaCliente) {
            const dataCliente = contrato.firmaCliente.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(dataCliente, 'base64'), 75, yBaseLineas - 65, { width: 130 });
        }
        doc.moveTo(60, yBaseLineas).lineTo(230, yBaseLineas).stroke();
        doc.font('Helvetica-Bold').fontSize(9).text("LA CONTRATANTE", 60, yBaseLineas + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text(contrato.clienteNombre, 60, yBaseLineas + 15, { width: 170, align: 'center' });

        // --- PROCESAR FIRMA DUEÑO / AE TECH (Derecha) ---
        if (contrato.firmaDueno) {
            const dataDueno = contrato.firmaDueno.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(dataDueno, 'base64'), 385, yBaseLineas - 65, { width: 130 });
        }
        doc.moveTo(370, yBaseLineas).lineTo(540, yBaseLineas).stroke();
        doc.font('Helvetica-Bold').fontSize(9).text("PRESTADOR DE SERVICIOS", 370, yBaseLineas + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text("Denisse Avila Espinoza", 370, yBaseLineas + 15, { width: 170, align: 'center' });

        doc.end();
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).send("Error generando PDF");
    }
};