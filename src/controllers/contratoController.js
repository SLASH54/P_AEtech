const Contrato = require('../models/Contrato'); // ✅ Una sola declaración al inicio

// 🔹 Guardar nuevo contrato con firma en Base64
exports.crearContrato = async (req, res) => {
    try {
        const { clienteNombre, clienteRFC, firmaData } = req.body;
        
        const nuevoContrato = await Contrato.create({
            clienteNombre,
            clienteRFC,
            firmaData 
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