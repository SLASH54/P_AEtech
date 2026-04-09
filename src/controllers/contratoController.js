const Contrato = require('../models/Contrato');
const cloudinary = require('cloudinary').v2; // 👈 Importamos cloudinary como en las evidencias



// 🔹 Guardar nuevo contrato con firma en Cloudinary



exports.crearContrato = async (req, res) => {
    try {
        // Recibimos lo que viene del frontend (script.js)
        const { clienteNombre, clienteRFC, contratoFirmaBase64 } = req.body;

        const nuevoContrato = await Contrato.create({
            cliente_nombre: clienteNombre, // Coincide con Contrato.js y Neon
            cliente_rfc: clienteRFC,       // Coincide con Contrato.js y Neon
            firma_base64: contratoFirmaBase64 // 👈 ESTO debe ser igual al nombre en req.body
        });

        res.status(201).json({ 
            success: true, 
            msg: "✅ Guardado en AE Tech", 
            id: nuevoContrato.id 
        });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, msg: error.message });
    }
};

// 🔹 Obtener historial de contratos
exports.obtenerContratos = async (req, res) => {
    try {
        const contratos = await Contrato.findAll({ order: [['createdAt', 'DESC']] });
        res.json(contratos);
    } catch (error) {
        console.error("❌ Error en obtenerContratos:", error);
        res.status(500).json({ msg: "Error al obtener el listado de contratos" });
    }
};




exports.crearContrato = async (req, res) => {
    try {
        const { clienteNombre, clienteRFC, contratoFirmaBase64 } = req.body;

        const nuevoContrato = await Contrato.create({
            cliente_nombre: clienteNombre,
            cliente_rfc: clienteRFC,
            firma_base64: contratoFirmaBase64 // Se guarda el Base64 directo
        });

        res.status(201).json({ 
            success: true, 
            msg: "✅ Guardado en la tabla contratos", 
            id: nuevoContrato.id 
        });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, msg: "Error de servidor" });
    }
};