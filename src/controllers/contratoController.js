const Contrato = require('../models/Contrato');

// 🔹 Guardar nuevo contrato con firma en la Base de Datos
exports.crearContrato = async (req, res) => {
    try {
        // Recibimos los datos del frontend (script.js)
        const { clienteNombre, clienteRFC, contratoFirmaBase64 } = req.body;

        // Validamos que los datos existan antes de intentar guardar
        if (!clienteNombre || !contratoFirmaBase64) {
            return res.status(400).json({ 
                success: false, 
                msg: "Faltan datos obligatorios (Nombre o Firma)" 
            });
        }

        // Guardamos en Neon usando los nombres exactos de tu modelo Contrato.js
        const nuevoContrato = await Contrato.create({
            cliente_nombre: clienteNombre,
            cliente_rfc: clienteRFC,
            firma_base64: contratoFirmaBase64 
        });

        res.status(201).json({ 
            success: true, 
            msg: "✅ Contrato guardado con éxito en AEtech", 
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