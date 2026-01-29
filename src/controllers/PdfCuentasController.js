const { Cuenta, CuentaMaterial } = require("../models/cuentasRelations");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");

async function cargarImagen(urlOrPath) {
  try {
    if (urlOrPath.startsWith("http")) {
      const res = await axios.get(urlOrPath, { responseType: "arraybuffer" });
      return res.data;
    } else {
      return fs.readFileSync(urlOrPath);
    }
  } catch (err) {
    console.log("⚠ Error cargando imagen:", urlOrPath, err.message);
    return null;
  }
}

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
    const logoURL = "https://p-aetech.onrender.com/public/logo1.png";
    const logoBuf = await cargarImagen(logoURL);

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
        if (logoBuf) {
            const logo = doc.openImage(logoBuf);
            doc.image(logo, 40, 20, { width: 110 });
        }
        doc.fillColor("#000").fontSize(20).font("Helvetica-Bold").text("NOTA DE SERVICIO", 350, 40);
        doc.fontSize(12).text(cuenta.numeroNota, 350, 65);
        doc.fontSize(10).font("Helvetica").text(`Fecha: ${new Date(cuenta.fecha).toLocaleDateString()}`, 350, 80);

        // --- DATOS DEL CLIENTE ---
        doc.moveDown(4);
        doc.fillColor("black").fontSize(12).font("Helvetica-Bold").text("CLIENTE:", 40, 140);
        doc.font("Helvetica").text(cuenta.clienteNombre, 40, 155);
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
            // Control de salto de página
            if (rowY > 650) {
                doc.addPage();
                rowY = 50;
            }

            // Imagen del producto
            if (mat.fotoUrl) {
                const imgBuffer = await procesarImagen(mat.fotoUrl, 50, 50);
                if (imgBuffer) {
                    doc.image(imgBuffer, 40, rowY, { width: 40 });
                }
            } else {
                doc.fontSize(8).text("Sin foto", 40, rowY + 15);
            }

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

        

        
            doc.text("SUBTOTAL:", 350, rowY);
            doc.text(`$${parseFloat(cuenta.subtotal).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });
            rowY += 20;

        // IVA si aplica
        if (cuenta.iva) {    
            const montoIva = (parseFloat(cuenta.subtotal) * cuenta.ivaPorcentaje) / 100;
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