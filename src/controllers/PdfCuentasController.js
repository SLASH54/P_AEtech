const { Cuenta, CuentaMaterial } = require("../models/cuentasRelations");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path"); // 👈 Agregado para rutas locales
const fs = require("fs");     // 👈 Agregado para leer archivos

// --- FUNCIÓN HÍBRIDA (Cloudinary + Local) ---
async function procesarImagen(fuente, maxW, maxH) {
    try {
        let data;
        
        // Si la fuente empieza con http, la descargamos (Cloudinary)
        if (fuente.startsWith('http')) {
            const res = await axios.get(fuente, { responseType: "arraybuffer" });
            data = res.data;
        } else {
            // Si no, la leemos del disco duro (Local)
            if (fs.existsSync(fuente)) {
                data = fs.readFileSync(fuente);
            } else {
                console.error("No se encontró el archivo local:", fuente);
                return null;
            }
        }

        return await sharp(data)
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

        // --- RUTA AL LOGO LOCAL ---
        // Ajusta los ".." según dónde esté tu carpeta public
        //const RUTA_LOGO_LOCAL = path.join(__dirname, "..", "public", "img", "logoAEtech.png");
        const RUTA_LOGO_LOCAL = "img/logoAEtech.png";

        const doc = new PDFDocument({ size: "LETTER", margin: 40 });
        
        // Corregido el header a PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=Nota_${cuenta.numeroNota}.pdf`);
        doc.pipe(res);

        // --- ENCABEZADO ---
        doc.rect(0, 0, 612, 100).fill("#f0f0f0");
        doc.image("img/logoAEtech.png", 40, rowY, { width: 40, height: 40 })
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

        for (const mat of cuenta.materiales) {
            if (rowY > 650) {
                doc.addPage();
                rowY = 50;
            }

            // LÓGICA DE IMAGEN: Si no hay fotoUrl, usamos la RUTA_LOGO_LOCAL
            const fuenteAUsar = (mat.fotoUrl && mat.fotoUrl.trim() !== "") 
                ? mat.fotoUrl 
                : RUTA_LOGO_LOCAL;

            const imgBuffer = await procesarImagen(fuenteAUsar, 40, 40);
            
            if (imgBuffer) {
                doc.image(imgBuffer, 40, rowY, { width: 40, height: 40 });
            } else {
                doc.fontSize(8).fillColor("#8e8e93").text("Sin imagen", 40, rowY + 15);
            }

            doc.fillColor("black").fontSize(10).font("Helvetica");
            doc.text(mat.nombre, 120, rowY + 15);
            doc.text(mat.cantidad.toString(), 350, rowY + 15, { width: 50, align: 'center' });
            doc.text(`$${parseFloat(mat.costo).toFixed(2)}`, 450, rowY + 15, { width: 100, align: 'right' });

            rowY += 60; 
            doc.moveTo(40, rowY - 5).lineTo(570, rowY - 5).strokeColor("#eee").stroke();
        }

        // --- TOTALES ---
        rowY += 20;
        doc.fillColor("black").font("Helvetica-Bold");

        if (cuenta.iva) {
            const montoIva = (parseFloat(cuenta.total) * (cuenta.ivaPorcentaje || 16)) / 100;
            doc.text(`IVA (${cuenta.ivaPorcentaje || 16}%):`, 350, rowY);
            doc.text(`$${montoIva.toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });
            rowY += 20;
        }

        doc.text("TOTAL:", 350, rowY);
        doc.text(`$${parseFloat(cuenta.total).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });
        rowY += 20;

        doc.text("ANTICIPO:", 350, rowY);
        doc.text(`$${parseFloat(cuenta.anticipo).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });
        rowY += 25;

        doc.fontSize(12).fillColor(cuenta.saldo > 0 ? "#d32f2f" : "#28a745");
        doc.text("POR LIQUIDAR:", 350, rowY);
        doc.text(`$${parseFloat(cuenta.saldo).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });

        doc.end();
    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ message: "Error al generar el PDF" });
    }
};