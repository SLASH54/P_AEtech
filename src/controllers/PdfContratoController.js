const Contrato = require("../models/Contrato");
const PDFDocument = require("pdfkit");
const axios = require("axios");

// Función para cargar el fondo AVER SI YA CARGA AJAJ 
async function cargarFondo(url) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return res.data;
    } catch (err) { 
        console.error("❌ Error cargando plantilla:", err.message);
        return null; 
    }
}

exports.generarPDFContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const contrato = await Contrato.findByPk(id);
        if (!contrato) return res.status(404).json({ msg: "Contrato no encontrado" });

        // 1. Cargamos la plantilla de AEtech primero
        const plantillaURL = "https://p-aetech.onrender.com/public/plantillas/plantilla_reporte.jpg";
        const plantillaBuf = await cargarFondo(plantillaURL);

        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Contrato_AEtech_${contrato.cliente_nombre}.pdf`);
        doc.pipe(res);

        // Función para poner el fondo en cada hoja
        const ponerFondo = () => {
            if (plantillaBuf) {
                doc.image(plantillaBuf, 0, 0, { width: 612, height: 792 });
            }
        };

        // --- HOJA 1 ---
        ponerFondo();

        // Encabezado alineado a la derecha
        doc.fontSize(10).font('Helvetica-Bold').text("AE TECH", { align: 'right' });
        doc.fontSize(8).font('Helvetica').text("Seguridad, Tecnología e Innovación", { align: 'right' });
        doc.moveDown(2);

        // Título Principal
        doc.fontSize(11).font('Helvetica-Bold').text("CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS", { align: 'center' });
        doc.moveDown();

        // --- CUERPO LEGAL COMPLETO ---
        doc.fontSize(9).font('Helvetica').fillColor("black");

        const introduccion = `Contrato por prestación de servicios especializados de instalación, implementación y distribución de sistema de seguridad electrónica con suministro de materiales y equipos en calidad de préstamo mismo que tendrá vigencia idéntica al presente contrato, que celebran por una parte Denisse Avila Espinoza a quien en lo sucesivo se le denominara “la prestadora” y, por la otra parte la Persona Sr(a). ${contrato.cliente_nombre}, con RFC ${contrato.cliente_rfc || 'S/N'}, a quien en lo sucesivo se le denominara “la contratante”, de conformidad con lo siguiente:`;

        doc.text(introduccion, { align: 'justify', lineGap: 2 });
        doc.moveDown();

        doc.font('Helvetica-Bold').text("DECLARACIONES", { align: 'center' });
        doc.moveDown(0.5);
        
        const declaraciones = `1.- Declara “la prestadora” ser una persona física inscrita en el RFC: AIED011026T79, con domicilio en calle 15 Poniente número 107, colonia Álvaro Obregón en Atlixco, Puebla.\n` +
            `2.- Declara “la prestadora” que su actividad es la prestación de servicios de instalación e implementación de sistemas de seguridad electrónica.\n` +
            `3.- Declara “la prestadora” tener la capacidad jurídica y personal profesional capacitado.\n` +
            `4.- Declara “la contratante” ser una persona física mexicana con plena capacidad legal para contratar.\n` +
            `5.- Declara “la contratante” que requiere obtener servicios especializados en seguridad electrónica.\n` +
            `6.- Declara la prestadora y la contratante que la bitácora y el contrato vinculan a las partes.`;

        doc.font('Helvetica').text(declaraciones, { align: 'justify', lineGap: 2 });
        doc.moveDown();

        doc.font('Helvetica-Bold').text("CLAUSULAS", { align: 'center' });
        doc.moveDown(0.5);

        const clausulas = `Primera. “La prestadora” se obliga a prestar el monitoreo de alarma vinculado a AE Tech.\n` +
            `Segunda. Los servicios serán proporcionados con recursos propios, obligándose a visitas técnicas y acceso a bitácora.\n` +
            `Tercera. Los suministros de equipo en préstamo se instalarán en el domicilio solicitado. Al término del periodo, el prestador podrá retirar el equipo.\n` +
            `Cuarta. El responsable del proyecto será el Mtro. Dionisio Avila Espinoza.\n` +
            `Quinta. La contratante pagara la cantidad de $580 (quinientos ochenta 00/100 M.N) mensuales.\n` +
            `Sexta. Ninguna parte podrá ceder derechos sin consentimiento escrito.\n` +
            `Séptima. El contrato tendrá una duración definida a partir de la firma.\n` +
            `Octava. Este contrato es el único que rige la prestación de servicios.\n` +
            `Novena. Para lo no previsto, se aplicará el Código Civil del Estado de Puebla y tribunales de Atlixco.\n` +
            `Décima. Penalizaciones: AE Tech podrá retirar equipos e interrumpir servicio por falta de pago o de facilidades técnicas.`;

        doc.font('Helvetica').text(clausulas, { align: 'justify', lineGap: 2 });
        doc.moveDown(2);

        const fechaHoy = new Date().toLocaleDateString();
        doc.text(`Leído que fue el presente contrato y enteradas las partes de su contenido, alcance y fuerza legal lo firman de conformidad en la ciudad de Atlixco, Puebla, el día ${fechaHoy}.`, { align: 'justify' });

        // --- SECCIÓN DE FIRMAS ---
        // Si no hay espacio, saltamos de hoja y repetimos fondo
        if (doc.y > 500) {
            doc.addPage();
            ponerFondo();
            doc.moveDown(5); 
        } else {
            doc.moveDown(5);
        }

        const yFirmas = doc.y;

        // FIRMA CLIENTE
        if (contrato.firma_base64) {
            const base64Data = contrato.firma_base64.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(base64Data, 'base64'), 70, yFirmas - 60, { width: 140 });
        }
        doc.moveTo(60, yFirmas).lineTo(230, yFirmas).stroke();
        doc.font('Helvetica-Bold').text("LA CONTRATANTE", 60, yFirmas + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text(contrato.cliente_nombre, 60, yFirmas + 15, { width: 170, align: 'center' });

        // FIRMA AE TECH
        doc.font('Courier-BoldOblique').fillColor("#000080").text("Denisse Avila E.", 350, yFirmas - 25, { width: 170, align: 'center' });
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