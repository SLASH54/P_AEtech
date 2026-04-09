const Contrato = require("../models/Contrato");
const PDFDocument = require("pdfkit");

exports.generarPDFContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const contrato = await Contrato.findByPk(id);
        if (!contrato) return res.status(404).json({ msg: "Contrato no encontrado" });

        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Contrato_AEtech_${contrato.cliente_nombre}.pdf`);
        doc.pipe(res);

        // --- ENCABEZADO ---
        doc.fontSize(10).font('Helvetica-Bold').text("AE TECH", { align: 'right' });
        doc.fontSize(8).font('Helvetica').text("Seguridad, Tecnología e Innovación", { align: 'right' });
        doc.moveDown(2);

        // --- TÍTULO ---
        doc.fontSize(11).font('Helvetica-Bold').text("CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS", { align: 'center' });
        doc.moveDown();

        // --- CUERPO LEGAL ---
        doc.fontSize(9).font('Helvetica').fillColor("black");

        // Introducción
        const intro = `Contrato por prestación de servicios especializados de instalación, implementación y distribución de sistema de seguridad electrónica con suministro de materiales y equipos en calidad de préstamo mismo que tendrá vigencia idéntica al presente contrato, que celebran por una parte Denisse Avila Espinoza a quien en lo sucesivo se le denominara “la prestadora” y, por la otra parte la Persona Sr(a). ${contrato.cliente_nombre}, con RFC ${contrato.cliente_rfc || 'S/N'}, a quien en lo sucesivo se le denominara “la contratante”, de conformidad con lo siguiente:`;
        doc.text(intro, { align: 'justify' });
        doc.moveDown();

        // Declaraciones
        doc.font('Helvetica-Bold').text("DECLARACIONES", { align: 'center' });
        doc.font('Helvetica').text(`1.- Declara “la prestadora” ser una persona física inscrita en el RFC: AIED011026T79, con domicilio en calle 15 Poniente número 107, colonia Álvaro Obregón en Atlixco, Puebla.
2.- Declara “la prestadora” que su actividad es la prestación de servicios de seguridad electrónica.
3.- Declara “la prestadora” tener la capacidad jurídica y personal capacitado para el proyecto.
4.- Por su parte declara “la contratante” ser una persona física con plena capacidad legal para obligarse.
5.- Declara “la contratante” que requiere servicios especializados en seguridad electrónica.
6.- Ambas partes declaran que la bitácora y el contrato vinculan sus derechos y obligaciones.`, { align: 'justify' });
        doc.moveDown();

        // Cláusulas
        doc.font('Helvetica-Bold').text("CLAUSULAS", { align: 'center' });
        doc.font('Helvetica').text(`Primera. “La prestadora” se obliga a prestar el monitoreo de alarma vinculado a “AE Tech”.
Segunda. Los servicios serán proporcionados con recursos propios, obligándose a visitas técnicas y acceso a bitácora.
Tercera. Los equipos en préstamo se instalarán en el domicilio solicitado. Al término del contrato, el prestador podrá retirar el equipo si no hay renovación.
Cuarta. El responsable del proyecto será el Mtro. Dionisio Avila Espinoza.
Quinta. La contratante pagara la cantidad de $580 (quinientos ochenta 00/100 M.N) mensuales el primer día de cada mes.
Sexta. Ninguna parte podrá ceder derechos sin consentimiento escrito.
Séptima. El contrato es vigente desde la firma hasta el término del periodo acordado.
Octava. Este documento rige como único acuerdo entre las partes.
Novena. Se aplican las leyes del Código Civil de Puebla y tribunales de Atlixco, Puebla.
Décima. Penalizaciones: En caso de incumplimiento de pagos o falta de facilidades técnicas, AE Tech podrá retirar equipos y finiquitar responsabilidad legal.`, { align: 'justify' });
        doc.moveDown();

        const fechaHoy = new Date().toLocaleDateString();
        doc.text(`Leído que fue el presente contrato y enteradas las partes de su contenido, alcance y fuerza legal lo firman de conformidad en la ciudad de Atlixco, Puebla, el día ${fechaHoy}.`, { align: 'justify' });
        doc.moveDown(4);

        // --- SECCIÓN DE FIRMAS (Formato idéntico al HTML) ---
        const yPos = doc.y;

        // LADO IZQUIERDO: CLIENTE
        if (contrato.firma_base64) {
            const base64Data = contrato.firma_base64.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(base64Data, 'base64'), 70, yPos - 50, { width: 130 });
        }
        doc.lineCap('butt').moveTo(60, yPos).lineTo(230, yPos).stroke();
        doc.font('Helvetica-Bold').text("LA CONTRATANTE", 60, yPos + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text(contrato.cliente_nombre, 60, yPos + 15, { width: 170, align: 'center' });

        // LADO DERECHO: AE TECH
        doc.font('Courier-BoldOblique').fillColor("#000080").text("Denisse Avila E.", 350, yPos - 20, { width: 170, align: 'center' });
        doc.fillColor("black");
        doc.lineCap('butt').moveTo(350, yPos).lineTo(520, yPos).stroke();
        doc.font('Helvetica-Bold').text("PRESTADOR DE SERVICIOS", 350, yPos + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').text("AE Tech", 350, yPos + 15, { width: 170, align: 'center' });

        doc.end();
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).send("Error al generar PDF");
    }
};