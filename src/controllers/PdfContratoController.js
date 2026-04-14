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
        res.setHeader("Content-Disposition", `attachment; filename=Contrato_AEtech_${contrato.cliente_nombre}.pdf`);
        doc.pipe(res);

        const ponerFondo = () => {
            if (plantillaBuf) doc.image(plantillaBuf, 0, 0, { width: 612, height: 792 });
        };

        // --- HOJA 1 ---
        ponerFondo();
        doc.y = 150; 

        doc.fontSize(10).font('Helvetica-Bold').text("CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS", { align: 'center' });
        doc.moveDown(1);

        doc.fontSize(9).font('Helvetica').fillColor("black");

        // INTRODUCCIÓN
        doc.text(`Contrato por prestación de servicios especializados de instalación, implementación y distribución de sistema de seguridad electrónica con suministro de materiales y equipos en calidad de préstamo mismo que tendrá vigencia idéntica al presente contrato, que celebran por una parte Denisse Avila Espinoza a quien en lo sucesivo se le denominara “la prestadora” y, por la otra parte la Persona Sr(a). ${contrato.cliente_nombre}, con RFC ${contrato.cliente_rfc || '[N/A]'}, a quien en lo sucesivo se le denominara “la contratante”, de conformidad con lo siguiente:`, { align: 'justify', lineGap: 2 });
        
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').text("DECLARACIONES", { align: 'center' });
        doc.moveDown(0.5);

        const declaraciones = [
            `1.- Declara “la prestadora” ser una persona física inscrita en el RFC: AIED011026T79, con domicilio en calle 15 Poniente número 107, colonia Álvaro Obregón en Atlixco, Puebla.`,
            `2.- Declara “la prestadora” que su actividad es la prestación de servicios de instalación e implementación de sistemas de seguridad electrónica.`,
            `3.- Declara “la prestadora” tener la capacidad jurídica y el personal profesional capacitado para prestar los servicios requeridos.`,
            `4.- Declara “la contratante” ser una persona física, mexicana, con plena capacidad legal para contratar y obligarse.`,
            `5.- Declara “la contratante” que requiere servicios especializados en seguridad electrónica, por lo que decidió contratar a “la prestadora”.`,
            `6.- Declara ambas partes que será la bitácora, el propio contrato y sus anexos quien vincule a las partes.`
        ];

        declaraciones.forEach(texto => {
            doc.font('Helvetica').text(texto, { align: 'justify', lineGap: 1 });
            doc.moveDown(0.3);
        });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text("CLAUSULAS", { align: 'center' });
        doc.moveDown(0.5);

        // CLÁUSULAS (Texto íntegro del contrato)
        const clausulas = [
            { t: "Primera.", c: "“La prestadora” se obliga a prestar a “la contratante” los servicios especializados de monitoreo de sistema de alarma vinculado a central “AE Tech”." },
            { t: "Segunda.", c: "Los servicios serán proporcionados con elementos propios. La prestadora se obliga a realizar visitas técnicas y tener acceso a la bitácora de obra." },
            { t: "Tercera.", c: "Los servicios se prestarán en el domicilio solicitado. Al término del contrato, el prestador podrá retirar el equipo en calidad de préstamo." },
            { t: "Cuarta.", c: "El responsable del proyecto será el Mtro. Dionisio Avila Espinoza." },
            { t: "Quinta.", c: "La contratante pagará la cantidad de $580 (quinientos ochenta 00/100 M.N) el primer día de cada mes." },
            { t: "Sexta.", c: "Ninguna de las partes podrá ceder los derechos de este contrato sin consentimiento por escrito." },
            { t: "Séptima.", c: "La duración será la pactada a partir de la firma del mismo." },
            { t: "Octava.", c: "Este contrato rige como acuerdo único, dejando sin efecto cualquier comunicación previa." },
            { t: "Novena.", c: "Para cualquier conflicto, las partes se someten a los tribunales de la ciudad de Atlixco, Puebla." }
        ];

        clausulas.forEach(item => {
            doc.font('Helvetica-Bold').text(item.t, { continued: true }).font('Helvetica').text(` ${item.c}`, { align: 'justify' });
            doc.moveDown(0.4);
        });

        // Control de salto de página para la última cláusula y firmas
        if (doc.y > 550) { 
            doc.addPage(); 
            ponerFondo(); 
            doc.y = 150; 
        }

        doc.font('Helvetica-Bold').text("Décima. Penalizaciones.", { continued: true }).font('Helvetica').text(" Se procederá a finiquitar responsabilidad o retirar equipo si el contratante incumple con pagos, información técnica o facilidades físicas.", { align: 'justify' });

        // --- PIE DE FIRMAS ---
        doc.moveDown(2);
        const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.font('Helvetica').text(`Leído que fue el presente contrato, lo firman de conformidad en la ciudad de Atlixco, Puebla, el día ${hoy}.`, { align: 'center' });

        doc.moveDown(5);
        const yEje = doc.y;

        // 🖋️ FIRMA CLIENTE (Izquierda)
        if (contrato.firma_base64) {
            const imgCliente = contrato.firma_base64.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(imgCliente, 'base64'), 75, yEje - 60, { width: 130 });
        }
        doc.moveTo(60, yEje).lineTo(230, yEje).stroke();
        doc.font('Helvetica-Bold').fontSize(8).text("LA CONTRATANTE", 60, yEje + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text(contrato.cliente_nombre, 60, yEje + 15, { width: 170, align: 'center' });

        // 🖋️ FIRMA DENISSE (Derecha)
        if (contrato.firma_prestadora_base64) {
            const imgDenisse = contrato.firma_prestadora_base64.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(imgDenisse, 'base64'), 395, yEje - 60, { width: 130 });
        }
        doc.moveTo(380, yEje).lineTo(550, yEje).stroke();
        doc.font('Helvetica-Bold').fontSize(8).text("PRESTADOR DE SERVICIOS", 380, yEje + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text("Denisse Avila Espinoza", 380, yEje + 15, { width: 170, align: 'center' });

        doc.end();
    } catch (error) {
        console.error("❌ Error en PDF:", error);
        res.status(500).send("Error al generar el documento");
    }
};