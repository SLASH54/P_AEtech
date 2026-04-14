const Contrato = require('../models/Contrato');
const PDFDocument = require("pdfkit");


const Contrato = require('../models/Contrato');

// 🔹 Guardar nuevo contrato con DOS firmas en la Base de Datos
exports.crearContrato = async (req, res) => {
    try {
        // 1. Recibimos los datos incluyendo la firma de la prestadora
        const { 
            clienteNombre, 
            clienteRFC, 
            contratoFirmaBase64, 
            firmaPrestadoraBase64 // <-- Nueva variable
        } = req.body;

        // 2. Validamos que los datos críticos existan (Nombre y AMBAS firmas)
        if (!clienteNombre || !contratoFirmaBase64 || !firmaPrestadoraBase64) {
            return res.status(400).json({ 
                success: false, 
                msg: "Faltan datos obligatorios (Nombre, Firma Cliente o Firma Denisse)" 
            });
        }

        // 3. Guardamos en Neon
        // IMPORTANTE: Asegúrate de que en tu modelo Contrato.js ya agregaste 'firma_prestadora_base64'
        const nuevoContrato = await Contrato.create({
            cliente_nombre: clienteNombre,
            cliente_rfc: clienteRFC,
            firma_base64: contratoFirmaBase64, // Firma del cliente
            firma_prestadora_base64: firmaPrestadoraBase64 // Firma de Denisse
        });

        res.status(201).json({ 
            success: true, 
            msg: "✅ Contrato y firmas guardados con éxito en AEtech", 
            id: nuevoContrato.id 
        });

    } catch (error) {
        console.error("❌ Error en crearContrato:", error);
        res.status(500).json({ 
            success: false, 
            msg: "Error de servidor: " + error.message 
        });
    }
};
// 🔹 Obtener historial de contratos (Arreglado para evitar error de createdAt)
exports.obtenerContratos = async (req, res) => {
    try {
        // Usamos 'id' para ordenar porque 'createdAt' no existe en tu tabla de Neon
        const contratos = await Contrato.findAll({ 
            order: [['id', 'DESC']] 
        });
        res.json(contratos);
    } catch (error) {
        console.error("❌ Error en obtenerContratos:", error);
        res.status(500).json({ 
            msg: "Error al obtener el listado de contratos" 
        });
    }
};


