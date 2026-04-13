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

        // Ajustamos márgenes para dar espacio al logo superior
        const doc = new PDFDocument({ margin: 70, size: 'LETTER' });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Contrato_AEtech_${contrato.cliente_nombre}.pdf`);
        doc.pipe(res);

        const ponerFondo = () => {
            if (plantillaBuf) doc.image(plantillaBuf, 0, 0, { width: 612, height: 792 });
        };

        // --- HOJA 1 ---
        ponerFondo();
        
        // BAJAMOS EL INICIO DEL TEXTO (Espacio para el logo)
        // Usamos doc.y para posicionar el primer bloque más abajo
        doc.y = 160; 

        doc.fontSize(11).font('Helvetica-Bold').text("CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS", { align: 'center' });
        doc.moveDown(1.5);

        // TEXTO GENERAL A 11 PUNTOS (Equivalente a Arial)
        doc.fontSize(11).font('Helvetica').fillColor("black");

        // INTRODUCCIÓN COMPLETA
        doc.text(`Contrato por prestación de servicios especializados de instalación, implementación y distribución de sistema de seguridad electrónica con suministro de materiales y equipos en calidad de préstamo mismo que tendrá vigencia idéntica al presente contrato, que celebran por una parte Denisse Avila Espinoza a quien en lo sucesivo se le denominara “la prestadora” en el texto del presente contrato y, por la otra parte la Persona Sr(a). ${contrato.cliente_nombre}, personalidad que acredita mediante el instrumento de inscripción al registro federal de contribuyente ${contrato.cliente_rfc || '___________'}, a quien en lo sucesivo se le denominara “la contratante”, de conformidad con lo siguiente:`, { align: 'justify', lineGap: 2 });
        
        doc.moveDown();
        doc.font('Helvetica-Bold').text("DECLARACIONES", { align: 'center' });
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
            doc.font('Helvetica').text(texto, { align: 'justify', lineGap: 1 });
            doc.moveDown(0.4);
        });

        // SALTO DE PÁGINA SI EL TEXTO ES MUCHO
        if (doc.y > 600) { doc.addPage(); ponerFondo(); doc.y = 160; }

        doc.moveDown();
        doc.font('Helvetica-Bold').text("CLAUSULAS", { align: 'center' });
        doc.moveDown(0.5);

        // CLÁUSULAS DETALLADAS
        doc.font('Helvetica').text(`Primera. “La prestadora” se obliga a prestar a “la contratante” los servicios especializados monitoreo de sistema de alarma vinculado a central de monitoreo “AE Tech”.`, { align: 'justify' });
        doc.moveDown(0.5);
        doc.text(`Segunda. Los servicios serán proporcionados por “la prestadora” con sus propios elementos personales y materiales. Se obliga a: a) Realizar visitas técnicas. b) Tener acceso a la bitácora de obra.`, { align: 'justify' });
        doc.moveDown(0.5);
        doc.text(`Tercera. Los suministros en calidad de préstamo (propiedad de la contratante) serán prestados en el domicilio solicitado. Al término del periodo, el prestador podrá retirar el equipo.`, { align: 'justify' });
        doc.moveDown(0.5);
        doc.text(`Cuarta. El responsable del proyecto será el Mtro. Dionisio Avila Espinoza.`, { align: 'justify' });
        doc.moveDown(0.5);
        doc.text(`Quinta. La contratante pagara a “la prestadora” la cantidad de $580 (quinientos ochenta 00/100 M.N) el primer día de cada mes.`, { align: 'justify' });

        if (doc.y > 600) { doc.addPage(); ponerFondo(); doc.y = 160; }

        doc.moveDown(0.5);
        doc.text(`Sexta a Novena. El contrato es intransferible, tiene duración definida, rige como acuerdo único y se somete a la jurisdicción de los tribunales de Atlixco, Puebla.`, { align: 'justify' });
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(`Décima. Penalizaciones.`, { continued: true }).font('Helvetica').text(` Se procederá a finiquitar responsabilidad o retirar equipo si el contratante no proporciona información, no cumple con pagos o no da facilidades físicas.`);

        // --- SECCIÓN DE FIRMAS ---
        doc.moveDown(2);
        const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Firma de conformidad en la ciudad de Atlixco, Puebla, el día ${hoy}.`, { align: 'center' });

        doc.moveDown(5);
        const yEje = doc.y;

        // Firma Cliente
        doc.moveTo(70, yEje).lineTo(230, yEje).stroke();
        doc.font('Helvetica-Bold').text("LA CONTRATANTE", 70, yEje + 5, { width: 160, align: 'center' });
        doc.font('Helvetica').text(contrato.cliente_nombre, 70, yEje + 18, { width: 160, align: 'center' });

        // Firma AE Tech
        doc.moveTo(380, yEje).lineTo(540, yEje).stroke();
        doc.font('Helvetica-Bold').text("PRESTADOR DE SERVICIOS", 380, yEje + 5, { width: 160, align: 'center' });
        doc.font('Helvetica').text("AE Tech", 380, yEje + 18, { width: 160, align: 'center' });

        doc.end();
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).send("Error generando PDF");
    }
};