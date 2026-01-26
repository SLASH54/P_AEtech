const { Cuenta, CuentaMaterial } = require("../models/cuentasRelations");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");

// Función para procesar las imágenes de Cloudinary para el PDF
async function procesarImagen(url, maxW, maxH) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return await sharp(res.data)
            .resize({ width: maxW, height: maxH, fit: "inside" })
            .toBuffer();
    } catch (err) {
        console.error("Error al procesar imagen para PDF:", err.message);
        return null;
    }
}

exports.generarPDFCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        const cuenta = await Cuenta.findByPk(id, {
            include: [{ model: CuentaMaterial, as: 'materiales' }]
        });

        if (!cuenta) return res.status(404).send("Cuenta no encontrada");

        const doc = new PDFDocument({ size: "LETTER", margin: 40 });
        
        // Configurar respuesta del navegador
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `inline; filename=Nota_${cuenta.numeroNota}.pdf`);
        doc.pipe(res);

        // --- ENCABEZADO ---
        doc.rect(0, 0, 612, 100).fill("#f0f0f0");
        doc.fillColor("#000").fontSize(20).font("Helvetica-Bold").text("NOTA DE SERVICIO", 40, 40);
        doc.fontSize(12).text(cuenta.numeroNota, 40, 65);
        doc.fontSize(10).font("Helvetica").text(`Fecha: ${new Date(cuenta.fecha).toLocaleDateString()}`, 40, 80);

        // --- DATOS DEL CLIENTE ---
        doc.moveDown(4);
        doc.fillColor("black").fontSize(12).font("Helvetica-Bold").text("CLIENTE:");
        doc.font("Helvetica").text(cuenta.clienteNombre);
        doc.moveDown();

        // --- TABLA DE PRODUCTOS ---
        const tableTop = 180;
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Imagen", 40, tableTop);
        doc.text("Producto", 120, tableTop);
        doc.text("Cant.", 350, tableTop, { width: 50, align: 'center' });
        doc.text("Precio Unit.", 450, tableTop, { width: 100, align: 'right' });
        
        doc.moveTo(40, tableTop + 15).lineTo(570, tableTop + 15).stroke();

        let rowY = tableTop + 25;

        // DENTRO DE PdfCuentasController.js
// Define la URL de tu logo por defecto (usa la de Cloudinary o una pública)
const LOGO_DEFAULT = "https://res.cloudinary.com/dngbc2icp/image/upload/v1768842144/aetech_levantamientos/xasjjj5bprdorstdgyte.webp"; 

for (const mat of cuenta.materiales) {
    // Si mat.fotoUrl no existe, usamos el logo
    let imgBuffer = null;
    const urlImagen = (mat.fotoUrl && mat.fotoUrl.trim() !== "") ? mat.fotoUrl : LOGO_DEFAULT;

    imgBuffer = await procesarImagen(urlImagen, 50, 50);

    if (imgBuffer) {
        doc.image(imgBuffer, 45, rowY, { width: 50, height: 50 });
    } else {
        // Si por alguna razón falla la carga, un espacio en blanco o texto
        doc.fontSize(8).text("Sin imagen", 45, rowY + 20);
    }
    
    // ... resto de tu código de texto (nombre, cantidad, etc.)


        

            doc.fillColor("black").fontSize(10).font("Helvetica");
            doc.text(mat.nombre, 120, rowY + 15);
            doc.text(mat.cantidad.toString(), 350, rowY + 15, { width: 50, align: 'center' });
            doc.text(`$${parseFloat(mat.costo).toFixed(2)}`, 450, rowY + 15, { width: 100, align: 'right' });

            rowY += 60; // Espacio entre filas
            doc.moveTo(40, rowY - 5).lineTo(570, rowY - 5).strokeColor("#eee").stroke();
        }

        // --- TOTALES ---
        rowY += 20;
        doc.fillColor("black").font("Helvetica-Bold");

        // IVA si aplica
        if (cuenta.iva) {
            const montoIva = (parseFloat(cuenta.total) * cuenta.ivaPorcentaje) / 100;
            doc.text(`IVA (${cuenta.ivaPorcentaje}%):`, 350, rowY);
            doc.text(`$${montoIva.toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });
            rowY += 20;
        }

        doc.text("TOTAL:", 350, rowY);
        doc.text(`$${parseFloat(cuenta.total).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });
        rowY += 20;

        doc.text("ANTICIPO:", 350, rowY);
        doc.text(`$${parseFloat(cuenta.anticipo).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });
        rowY += 25;

        // Saldo Final (En negrita y resaltado)
        doc.fontSize(12).fillColor(cuenta.saldo > 0 ? "#d32f2f" : "#28a745");
        doc.text("POR LIQUIDAR:", 350, rowY);
        doc.text(`$${parseFloat(cuenta.saldo).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });

        doc.end();
    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ message: "Error al generar el PDF" });
    }
};