const Contrato = require('../models/Contrato');
const cloudinary = require('cloudinary').v2; // 👈 Importamos cloudinary como en las evidencias

// 🔹 Guardar nuevo contrato con firma en Cloudinary
exports.crearContrato = async (req, res) => {
    try {
        // Recibimos los datos con nombres específicos para contrato
        const { clienteNombre, clienteRFC, contratoFirmaBase64 } = req.body;

        let urlFinalCloudinary = null;

        // 1️⃣ Subir la firma a Cloudinary (Carpeta separada de evidencias)
        if (contratoFirmaBase64) {
            const result = await cloudinary.uploader.upload(contratoFirmaBase64, {
                folder: 'aetech_contratos_oficiales',
                resource_type: 'image'
            });
            urlFinalCloudinary = result.secure_url;
        }

        // 2️⃣ Guardar en la base de datos con la nueva variable contratoFirmaUrl
        const nuevoContrato = await Contrato.create({
            clienteNombre,
            clienteRFC,
            contratoFirmaUrl: urlFinalCloudinary // 🛡️ Nombre único para no chocar
        });

        res.status(201).json({ 
            success: true, 
            msg: "✅ Contrato guardado con éxito en AE Tech", 
            id: nuevoContrato.id 
        });

    } catch (error) {
        console.error("❌ Error en crearContrato:", error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al guardar el contrato en el servidor" 
        });
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