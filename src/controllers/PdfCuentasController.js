const { Cuenta, CuentaMaterial } = require("../models/cuentasRelations");
const PDFDocument = require("pdfkit");
const axios = require("axios");
// 🚀 IMPORTAMOS SHARP PARA LA MAGIA
const sharp = require("sharp");

// Función auxiliar para cargar imágenes base (como logos locales)
async function cargarImagenBase(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return res.data;
  } catch (err) {
    console.log("⚠ Error cargando imagen base:", url, err.message);
    return null;
  }
}

/**
 * 🛠️ ESTA ES LA FUNCIÓN CLAVE: "PROCESAR IMAGEN"
 * Sharp toma el buffer de Cloudinary, lo convierte a PNG,
 * lo redimensiona y te devuelve un Buffer limpio para PDFKit.
 */
async function procesarImagenParaPDF(url, maxW, maxH) {
    if (!url) return null;
    try {
        // 1. Descargar la imagen de Cloudinary como buffer
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const imageBuffer = res.data;

        // 2. LA MAGIA DE SHARP:
        // Convertimos a PNG (estándar para PDFKit) y redimensionamos de una vez
        // para que el PDF no pese megas y megas.
        const processedBuffer = await sharp(imageBuffer)
            .png() // 🔄 CONVERSIÓN FORZOSA A PNG (Adiós WEBP/GIF raros)
            .resize({
                width: maxW,
                height: maxH,
                fit: "inside", // Mantiene la proporción sin deformar
                withoutEnlargement: true // No estira imágenes pequeñas
            })
            .toBuffer(); // Nos devuelve un buffer listo

        return processedBuffer;
    } catch (err) {
        console.error("❌ Error al procesar imagen para PDF con Sharp:", url, err.message);
        return null; // Si falla, devolvemos null para no tirar el PDF
    }
}


exports.generarPDFCuenta = async (req, res) => {
    // Definimos los logos estándar
    const logoURL = "https://p-aetech.onrender.com/public/logo1.png";
    const logoBuf = await cargarImagenBase(logoURL);

    const noimgURL = "https://p-aetech.onrender.com/public/logo.png";
    const noimgBuf = await cargarImagenBase(noimgURL);

    try {
        const { id } = req.params;
        // Buscamos la cuenta e incluimos los materiales (fotos de Cloudinary)
        const cuenta = await Cuenta.findByPk(id, {
            include: [{ model: CuentaMaterial, as: 'materiales' }]
        });

        if (!cuenta) return res.status(404).send("Cuenta no encontrada");

        // Crear el documento PDFKit
        const doc = new PDFDocument({ size: "LETTER", margin: 40 });
        
        // Configurar respuesta del navegador para que lo abra en pestaña nueva
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=Nota_${cuenta.numeroNota || cuenta.id}.pdf`);
        doc.pipe(res);

        // --- ENCABEZADO (FONDO GRIS) ---
        doc.rect(0, 0, 612, 100).fill("#f0f0f0");
        
        // Poner el logo principal (Ya viene pre-cargado)
        if (logoBuf) {
            doc.image(logoBuf, 40, 20, { width: 110 });
        }
        
        doc.fillColor("#000").fontSize(20).font("Helvetica-Bold").text("NOTA DE SERVICIO", 350, 40);
        doc.fontSize(12).text(cuenta.numeroNota || `Nota #${cuenta.id}`, 350, 65);
        doc.fontSize(10).font("Helvetica").text(`Fecha: ${new Date(cuenta.fecha || cuenta.createdAt).toLocaleDateString('es-MX')}`, 350, 80);

        // --- DATOS DEL CLIENTE ---
        doc.moveDown(4);
        doc.fillColor("black").fontSize(12).font("Helvetica-Bold").text("CLIENTE:", 40, 140);
        doc.font("Helvetica").text(cuenta.clienteNombre, 40, 155);
        doc.moveDown();

        // --- TABLA DE PRODUCTOS (ENCABEZADOS) ---
        const tableTop = 180;
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Imagen", 40, tableTop);
        doc.text("Producto", 120, tableTop);
        doc.text("Cant.", 350, tableTop, { width: 50, align: 'center' });
        doc.text("Precio Unit.", 450, tableTop, { width: 100, align: 'right' });
        
        // Línea divisoria
        doc.moveTo(40, tableTop + 15).lineTo(570, tableTop + 15).strokeColor("#ccc").stroke();

        let rowY = tableTop + 25;

        // --- BUCLE DE PRODUCTOS ---
        for (const mat of cuenta.materiales) {
            // Control elemental de salto de página
            if (rowY > 650) {
                doc.addPage();
                // Ponemos los encabezados de tabla de nuevo en la página nueva si quieres (opcional)
                rowY = 50; 
            }

            doc.fillColor("black").fontSize(10).font("Helvetica");

            // 📸 LA PARTE IMPORTANTE: Imagen del producto procesada con Sharp
            if (mat.fotoUrl) {
                // Llamamos a la función mágica de Sharp (Estandariza a PNG y redimensiona a 50x50)
                const imgBuffer = await procesarImagenParaPDF(mat.fotoUrl, 50, 50);
                
                if (imgBuffer) {
                    // Si Sharp funcionó, insertamos el buffer PNG
                    doc.image(imgBuffer, 40, rowY, { width: 40, height: 40 });
                } else {
                    // Si sharp falló (raro), ponemos el logo por defecto
                    if (noimgBuf) doc.image(noimgBuf, 40, rowY, { width: 40, height: 40 });
                }
            } else {
                // Si no tiene fotoUrl, ponemos el logo por defecto
                if (noimgBuf) {
                    doc.image(noimgBuf, 40, rowY, { width: 40, height: 40 });
                }
            }

            // Texto del producto alineado con la imagen
            doc.text(mat.nombre, 120, rowY + 15);
            doc.text(mat.cantidad.toString(), 350, rowY + 15, { width: 50, align: 'center' });
            
            const costoFila = parseFloat(mat.costo) || 0;
            doc.text(`$${costoFila.toFixed(2)}`, 450, rowY + 15, { width: 100, align: 'right' });

            // Espacio para la siguiente fila y línea divisoria suave
            rowY += 60; 
            doc.moveTo(40, rowY - 5).lineTo(570, rowY - 5).strokeColor("#eee").stroke();
        }

        // --- SECCIÓN DE TOTALES ---
        rowY += 20;
        doc.fillColor("black").font("Helvetica-Bold");

        doc.text("SUBTOTAL:", 350, rowY);
        doc.text(`$${parseFloat(cuenta.subtotal).toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });
        rowY += 20;

        // IVA si aplica
        if (cuenta.iva) {    
            const montoIva = (parseFloat(cuenta.subtotal) * (cuenta.ivaPorcentaje || 16)) / 100;
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

        // Fecha de anticipo si existe
        if (cuenta.fecha_anticipo) {
            doc.fillColor("#444444").fontSize(10).font("Helvetica-Bold");
            doc.text("FECHA DE ANTICIPO:", 380, rowY);
            const fAnticipo = new Date(cuenta.fecha_anticipo).toLocaleDateString('es-MX');
            doc.font("Helvetica").text(fAnticipo, 500, rowY);
            rowY += 25;
        }

        // Saldo Final (En negrita y resaltado)
        const saldoFinal = parseFloat(cuenta.saldo) || 0;
        doc.fontSize(12).fillColor(saldoFinal > 0 ? "#d32f2f" : "#28a745");
        doc.text("POR LIQUIDAR:", 350, rowY);
        doc.text(`$${saldoFinal.toFixed(2)}`, 450, rowY, { width: 100, align: 'right' });

        // --- BADGE DE ESTATUS FINANCIERO ---
        rowY += 30; 
        const statusNota = cuenta.estatus ? cuenta.estatus.toUpperCase() : (saldoFinal <= 0 ? "PAGADO" : "PENDIENTE");
        let colorStatus = "#f39c12"; // Naranja (Pendiente)

        if (statusNota === "PAGADO") colorStatus = "#28a745"; // Verde
        if (statusNota === "CANCELADO") colorStatus = "#d32f2f"; // Rojo

        // Dibujamos un rectángulo redondeado para el status
        doc.roundedRect(400, rowY, 150, 22, 5).fill(colorStatus);
        doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold");
        doc.text(statusNota, 400, rowY + 6, { width: 150, align: 'center' });

        // --- FECHA DE LIQUIDACIÓN ---
        if (statusNota === "PAGADO" && cuenta.fechaLiquidacion) {
            rowY += 28; 
            doc.fillColor("#8e8e93").fontSize(9).font("Helvetica");
            const fLiq = new Date(cuenta.fechaLiquidacion).toLocaleDateString('es-MX');
            doc.text(`Liquidado el: ${fLiq}`, 400, rowY, { width: 150, align: 'center' });
        }

        // Finalizar el documento
        doc.end();

    } catch (error) {
        console.error("❌ Error generando PDF Crítico:", error);
        // Si hay error, al menos mandamos una respuesta para que el navegador no se quede colgado
        if (!res.headersSent) {
            res.status(500).json({ message: "Error crítico al generar el PDF", error: error.message });
        }
    }
};