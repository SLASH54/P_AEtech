// controllers/contratoController.js
const Contrato = require('../models/Contrato');
const { generarPDF } = require('../utils/pdfGenerator');

exports.crearContrato = async (req, res) => {
    try {
        const { clienteNombre, clienteRFC, firmaCliente, firmaDueno } = req.body;

        // Guardar en la base de datos
        const nuevoContrato = await Contrato.create({
            clienteNombre,
            clienteRFC,
            firmaCliente,
            firmaDueno
        });

        res.json({ success: true, id: nuevoContrato.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: "Error al guardar contrato" });
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