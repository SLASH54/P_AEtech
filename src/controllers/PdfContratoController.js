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

        // 1. Creamos el documento
        const doc = new PDFDocument({ margin: 70, size: 'LETTER' });

        // 2. CONFIGURACIÓN AUTOMÁTICA DE FONDO (EL EVENTO CLAVE)
        // Cada vez que se agregue una página (manual o automáticamente), se pondrá el fondo
        doc.on('pageAdded', () => {
            if (plantillaBuf) {
                doc.image(plantillaBuf, 0, 0, { width: 612, height: 792 });
            }
            doc.y = 160; // Reiniciamos el margen superior en cada hoja nueva para no chocar con el logo
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Contrato_AEtech_${contrato.cliente_nombre}.pdf`);
        doc.pipe(res);

        // 3. PRIMERA HOJA (Se pone manualmente porque el evento pageAdded no dispara en la pág 1)
        if (plantillaBuf) doc.image(plantillaBuf, 0, 0, { width: 612, height: 792 });
        doc.y = 160; 

        doc.fontSize(11).font('Arial-Bold').text("CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS", { align: 'center' });
        doc.moveDown(1.5);

        doc.fontSize(11).font('Arial MT').fillColor("black");

        // INTRODUCCIÓN
        doc.text(`Contrato por prestación de servicios especializados de instalación, implementación y distribución de sistema de seguridad electrónica con suministro de materiales y equipos en calidad de préstamo mismo que tendrá vigencia idéntica al presente contrato, que celebran por una parte Denisse Avila Espinoza a quien en lo sucesivo se le denominara “la prestadora” en el texto del presente contrato y, por la otra parte la Persona Sr(a). ${contrato.cliente_nombre}, personalidad que acredita mediante el instrumento de inscripción al registro federal de contribuyente ${contrato.cliente_rfc || '___________'}, a quien en lo sucesivo se le denominara “la contratante”, de conformidad con lo siguiente:`, { align: 'justify', lineGap: 2 });
        
        doc.moveDown();
        doc.font('Arial-Bold').text("DECLARACIONES", { align: 'center' });
        doc.moveDown(0.5);

        const declaraciones = [
            `1.- Declara “la prestadora” ser una persona física inscrita en el Registro Federal de Contribuyentes, con clave: AIED011026T79, con domicilio en calle 15 Poniente número 107, colonia Álvaro Obregón en Atlixco, Puebla.`,
            `2.- Declara “la prestadora” que su actividad es entre otras, la prestación de servicios de instalación, implementación de sistemas de seguridad electrónica, tendientes a satisfacer las necesidades de “la contratante”.`,
            `3.- Declara “la prestadora” tener la capacidad jurídica para celebrar todo tipo de contratos relacionados con su actividad, así como contar con el personal profesional capacitado para prestar a la contratante los servicios requeridos y que cuenta con la capacidad y experiencia técnica suficiente.`,
            `4.- Por su parte declara “la contratante”, por medio de su representante, ser una persona física, mexicana, debidamente constituida conforme a las leyes vigentes con plena capacidad legal para contratar.`,
            `5.- Declara “la contratante” que para realizar su objeto social requiere de la obtención de servicios especializados en seguridad electrónica, instalación e implementación.`,
            `6.- Declara la prestadora y la contratante: que será la bitácora, el propio contrato y sus anexos quien vincule a las partes.`
        ];

        declaraciones.forEach(texto => {
            doc.font('Arial MT').text(texto, { align: 'justify', lineGap: 1 });
            doc.moveDown(0.4);
        });

        doc.moveDown();
        doc.font('Arial-Bold').text("CLAUSULAS", { align: 'center' });
        doc.moveDown(0.5);

        doc.font('Arial MT').text(`Primera. “La prestadora” se obliga a prestar a “la contratante” los servicios especializados monitoreo de sistema de alarma vinculado a central de monitoreo “AE Tech”.`, { align: 'justify' });
        doc.moveDown(0.5);
        
        doc.text(`Segunda. Los servicios serán proporcionados por “la prestadora” con sus propios elementos personales y materiales. Se obliga a: a) Realizar visitas técnicas. b) Tener acceso a la bitácora de obra.`, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(`Tercera. Los suministros en calidad de préstamo (propiedad de la contratante) serán prestados fundamentalmente en las instalaciones solicitadas por la parte contratante, con domicilio en: `, { align: 'justify', continued: true })
           .font('Arial-Bold').text(`${contrato.domicilio || '_________________________________'}`, { continued: true })
           .font('Arial MT').text(`, al término del periodo contratado el prestador podrá retirar el equipo.`);
        doc.moveDown(0.5);

        doc.text(`Cuarta. El responsable del proyecto será el Mtro. Dionisio Avila Espinoza, quien llenará la bitácora de equipos integrados.`, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(`Quinta. La contratante pagará a “la prestadora” la cantidad de $580 (quinientos ochenta 00/100 M.N) el primer día de cada mes durante un periodo de `, { align: 'justify', continued: true })
           .font('Arial-Bold').text(`${contrato.meses_contrato || '___'} meses`, { continued: true })
           .font('Arial MT').text(`, realizando el pago en las oficinas de AE Tech.`);
        doc.moveDown(0.5);

        doc.text(`Sexta. El contrato es intransferible sin consentimiento por escrito.`, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(`Séptima. El presente contrato tendrá una duración del `, { align: 'justify', continued: true })
           .font('Arial-Bold').text(`${contrato.fecha_inicio || '________'}`, { continued: true })
           .font('Arial MT').text(` al `, { continued: true })
           .font('Arial-Bold').text(`${contrato.fecha_fin || '________'}`, { continued: true })
           .font('Arial MT').text(` a partir de la firma del mismo.`);
        doc.moveDown(0.5);

        doc.text(`Octava y Novena. Rige como acuerdo único y se somete a la jurisdicción de los tribunales de Atlixco, Puebla.`, { align: 'justify' });
        doc.moveDown(0.5);

        doc.font('Arial-Bold').text(`Décima. Penalizaciones.`, { continued: true }).font('Helvetica').text(` Se procederá a finiquitar responsabilidad o retirar equipo si el contratante no proporciona información, no cumple con pagos o no da facilidades físicas.`);

        // --- SECCIÓN DE FIRMAS ---
        // Si después de todo el texto queda muy poco espacio (menos de 200px), agregamos una hoja nueva para las firmas
        if (doc.y > 550) doc.addPage(); 

        doc.moveDown(2);
        const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.font('Arial MT').text(`Leído el presente y enteradas las partes, lo firman en la ciudad de Atlixco, Puebla, el día ${hoy}.`, { align: 'center' });

        doc.moveDown(5);
        const yFirmas = doc.y;

        // FIRMA CLIENTE
        if (contrato.firma_cliente) {
            const base64Cliente = contrato.firma_cliente.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(base64Cliente, 'base64'), 75, yFirmas - 65, { width: 130 });
        }
        doc.moveTo(60, yFirmas).lineTo(230, yFirmas).stroke();
        doc.font('Arial-Bold').text("LA CONTRATANTE", 60, yFirmas + 5, { width: 170, align: 'center' });
        doc.font('Arial MT').fontSize(9).text(contrato.cliente_nombre, 60, yFirmas + 15, { width: 170, align: 'center' });

        // FIRMA AE TECH
        if (contrato.firma_dueno) {
            const base64Dueno = contrato.firma_dueno.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(base64Dueno, 'base64'), 395, yFirmas - 65, { width: 130 });
        }
        doc.moveTo(380, yFirmas).lineTo(540, yFirmas).stroke();
        doc.fontSize(11).font('Arial-Bold').text("PRESTADOR DE SERVICIOS", 380, yFirmas + 5, { width: 160, align: 'center' });
        doc.font('Arial MT').fontSize(9).text("Denisse Avila Espinoza", 380, yFirmas + 15, { width: 160, align: 'center' });

        doc.end();
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).send("Error generando PDF");
    }
};