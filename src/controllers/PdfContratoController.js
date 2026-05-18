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

        doc.fontSize(11).font('Helvetica-Bold').text("CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS", { align: 'center' });
        doc.moveDown(1.5);

        doc.fontSize(11).font('Helvetica').fillColor("black");

        // INTRODUCCIÓN
        doc.text(`Contrato por prestación de servicios especializados de instalación, implementación y distribución de sistema de seguridad electrónica con suministro de materiales y equipos en calidad de préstamo mismo que tendrá vigencia idéntica al presente contrato, que celebran por una parte Denisse Avila Espinoza a quien en lo sucesivo se le denominara “la prestadora” en el texto del presente contrato y, por la otra parte la Persona Sr(a). ${contrato.cliente_nombre}, personalidad que acredita mediante el instrumento de inscripción al registro federal de contribuyente ${contrato.cliente_rfc || '___________'}, a quien en lo sucesivo se le denominara “la contratante”, de conformidad con lo siguiente:`, { align: 'justify', lineGap: 2 });
        
        doc.moveDown();
        doc.font('Helvetica-Bold').text("DECLARACIONES", { align: 'center' });
        doc.moveDown(0.5);

        const declaraciones = [
            `1.- Declara “la prestadora” ser una persona física inscrita en el Registro Federal de Contribuyentes, con clave: AIED011026T79, con domicilio en calle 15 Poniente número 107, colonia Álvaro Obregón en Atlixco, Puebla.`,
            `2.- Declara “la prestadora” que su actividad es entre otras, la prestación de servicios de instalación, implementación de sistemas de seguridad electrónica, tendientes a satisfacer las necesidades de “la contratante”.`,
            `3.- Declara “la prestadora” tener la capacidad jurídica para celebrar todo tipo de contratos relacionados con su actividad, así como contar con el personal profesional capacitado para prestar a la contratante los servicios requeridos y que cuenta con la capacidad y experiencia técnica suficiente,  conociendo las normas para la implementación del proyecto.`,
            `4.- Por su parte declara “la contratante”, por medio de su representante, ser una persona física, mexicana, debidamente constituida conforme a las leyes vigentes con plena capacidad legal para contratar y obligarse en los términos del presente contrato.`,
            `5.- Declara “la contratante” que para realizar su objeto social requiere de la obtención de servicios especializados en seguridad electrónica, instalación e implementación, por lo que decidió contratar dichos servicios con “la prestadora”, la cual está preparada para proporcionárselos en forma especializada.`,
            `6.- Declara la prestadora y la contratante: que será la bitácora, el propio contrato y sus anexos quien vincule a las partes que declaren motivo de este contrato en sus derechos y obligaciones.`,
        ];

        declaraciones.forEach(texto => {
            doc.font('Helvetica').text(texto, { align: 'justify', lineGap: 1 });
            doc.moveDown(0.4);
        });

        doc.moveDown();
        doc.font('Helvetica-Bold').text("CLAUSULAS", { align: 'center' });
        doc.moveDown(0.5);

        doc.font('Helvetica').text(`Primera. “La prestadora” se obliga a prestar a “la contratante” los servicios especializados monitoreo de sistema de alarma vinculado a central de monitoreo “AE Tech”.`, { align: 'justify' });
        doc.moveDown(0.5);
        
        doc.text(`. Los servicios objeto del presente contrato serán proporcionados por “la prestadora” a “la contratante” con sus propios elementos personales y materiales, ya que cuenta con el personal especializado necesario para ello y con el equipo idóneo para proporcionarlos. Queda expresamente convenido que los servicios serán prestados por la prestadora a la contratante con su propio personal, obligandose a: a) Realizar con el apoyo total de la contratante las visitas de carácter técnico de cuando menos al inicio y durante el periodo comprendido en el contrato. b) Tener acceso a la bitácora de la obra en ejecución con la autoridad que corresponda para anotar las observaciones pertinentes y que redunden en el proceso constructivo como en el avance de la misma.`, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(`Tercera. Los servicios y suministros de material y equipo en calidad de préstamo (propiedad de la contratante) objeto del presente contrato serán prestados fundamentalmente en las instalaciones solicitadas por la parte contratante, con domicilio `, { align: 'justify', continued: true })
           .font('Helvetica-Bold').text(`${contrato.domicilio || '_________________________________'}`, { continued: true })
           .font('Helvetica').text(`, al término del periodo contratado el prestador podrá retirar el equipo  en calidad de préstamo en caso de no renovarse la vigencia del mismo, el personal encargado de prestar los servicios estará sujeto a las reglas sobre el ingreso a las instalaciones.`);
        doc.moveDown(0.5);

        doc.text(`Cuarta. Manifiesta “la prestadora” que el responsable de la realización del proyecto objeto de este contrato, será el Mtro. Dionisio Avila Espinoza, quien llenara la bitácora de equipos integrados en el domicilio de la parte contratante. `, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(`Quinta. Con motivo de los servicios, suministro de materiales y equipo, objeto del presente contrato que proporciona “la prestadora” y que estarán disponibles a favor de “la contratante” durante toda la vigencia del mismo, “la contratante pagara a “la prestadora” la cantidad de $580 (quinientos ochenta 00/100 M.N) el primer día de cada mes durante un periodo de `, { align: 'justify', continued: true })
           .font('Helvetica-Bold').text(`${contrato.meses_contrato || '___'} meses`, { continued: true })
           .font('Helvetica').text(`, realizando el pago en las oficinas de AE Tech o mediante transferencia bancaria a los datos proporcionados por AE Tech.`);
        doc.moveDown(0.5);

        doc.text(`Sexta. Ninguna de las partes contratantes podrá ceder o transmitir los derechos y obligaciones que contraen en los términos del presente contrato sin el expreso consentimiento por escrito de la contraparte respectiva.`, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(`Séptima. El presente contrato tendrá una duración del `, { align: 'justify', continued: true })
           .font('Helvetica-Bold').text(`${contrato.fecha_inicio || '________'}`, { continued: true })
           .font('Helvetica').text(` al `, { continued: true })
           .font('Helvetica-Bold').text(`${contrato.fecha_fin || '________'}`, { continued: true })
           .font('Helvetica').text(` a partir de la firma del mismo, en caso de algún contra tiempo ya sea interno o externo “la prestadora” le notificará a “la contratante” para valorar la situación. .`);
        doc.moveDown(0.5);

        doc.text(`Octava.  Las partes manifiestan que el presente contrato es el único que rige la prestación de los servicios objeto del mismo, por lo que dejan sin efecto cualquier otro contrato, convenio, documento o comunicación verbal o escrita que pudiera haber entre las partes. El presente contrato solo podrá ser modificado mediante acuerdo por escrito debidamente firmado. `, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(`Novena.  Para todo lo no previsto en el presente contrato se aplicarán las disposiciones legales previstas en el Código Civil del Estado Libre y Soberano de Puebla vigente. Para cualquier conflicto derivado de la interpretación, cumplimiento o incumplimiento del presente contrato, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de Atlixco, Puebla, renunciando a cualquier fuero que por razón de su domicilio les corresponda o pudiera corresponderles en el futuro.`, { align: 'justify' });
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').text(`Décima.`, { continued: true }).font('Helvetica').text(`Se procederá a las penalizaciones correspondientes de acuerdo a los siguientes puntos: `);
        doc.moveDown(0.5);

        doc.text(`               - Si el contratante no cumple con sus obligaciones tales como: `, { align: 'justify' });
        doc.moveDown(0.5);
        
        doc.text(`I. No proporcionar la información técnica solicitada por él prestador para su buen desempeño. `, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(`II. No cumple con el pago de honorarios por proyecto acordado con el prestador.`, { align: 'justify' });
        doc.moveDown(0.5);

         doc.text(`III. No proporcionar todas las facilidades físicas a AE Tech para que pueda realizar sus visitas a las obras.`, { align: 'justify' });
         doc.moveDown(0.5);

         doc.text(`IV. Los montos pueden variar si existen retrasos en la ejecución del proyecto ajenos a AE Tech, ademas de la posibilidad de daños al avance por parte de terceros con o sin dolo. `, { align: 'justify' });
         doc.moveDown(0.15);

        doc.text(`       - El prestador procedera: `, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(` I. AE Tech podrá dar por finiquitado cualquier responsabilidad legal en caso de que el contratante incumpla en alguno de los puntos mencionados. `, { align: 'justify' });
        doc.moveDown(0.5);

        doc.text(` II. AE Tech podrá hacer el retiro de los equipos en calidad de préstamo en las instalaciones de la parte contratante.  `, { align: 'justify' });
        doc.moveDown(0.5);
        // --- SECCIÓN DE FIRMAS ---
        // Si después de todo el texto queda muy poco espacio (menos de 200px), agregamos una hoja nueva para las firmas
        if (doc.y > 550) doc.addPage(); 

        doc.moveDown(2);
        const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.font('Helvetica').text(`Leído el presente contrato y enteradas las partes  de su contenido, alcance y fuerza legal lo firman de conformidad en la ciudad de Atlixco, Puebla, el día ${hoy}.`, { align: 'center' });

        doc.moveDown(6);
        const yFirmas = doc.y;

        // FIRMA CLIENTE
        if (contrato.firma_cliente) {
            const base64Cliente = contrato.firma_cliente.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(base64Cliente, 'base64'), 75, yFirmas - 65, { width: 130 });
        }
        doc.moveTo(60, yFirmas).lineTo(230, yFirmas).stroke();
        doc.font('Helvetica-Bold').text("LA CONTRATANTE", 60, yFirmas + 5, { width: 170, align: 'center' });
        doc.font('Helvetica').fontSize(9).text(contrato.cliente_nombre, 60, yFirmas + 15, { width: 170, align: 'center' });

        // FIRMA AE TECH
        if (contrato.firma_dueno) {
            const base64Dueno = contrato.firma_dueno.replace(/^data:image\/\w+;base64,/, "");
            doc.image(Buffer.from(base64Dueno, 'base64'), 395, yFirmas - 65, { width: 130 });
        }
        doc.moveTo(380, yFirmas).lineTo(540, yFirmas).stroke();
        doc.fontSize(11).font('Helvetica-Bold').text("PRESTADOR DE SERVICIOS", 380, yFirmas + 5, { width: 160, align: 'center' });
        doc.font('Helvetica').fontSize(9).text("Denisse Avila Espinoza", 380, yFirmas + 15, { width: 160, align: 'center' });

        doc.end();
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).send("Error generando PDF");
    }
};