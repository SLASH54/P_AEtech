const Contrato = require('../models/Contrato');

const Contrato = require('../models/Contrato'); //

// 🔹 Guardar nuevo contrato con firma en Base64
exports.crearContrato = async (req, res) => {
    try {
        // Extraemos los datos que vienen del frontend
        const { clienteNombre, clienteRFC, firmaData } = req.body;
        
        // Creamos el registro en la tabla 'Contratos'
        const nuevoContrato = await Contrato.create({
            clienteNombre,
            clienteRFC,
            firmaData // Aquí se guarda el texto largo de la firma
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

// 🔹 Obtener historial de contratos (opcional)
exports.obtenerContratos = async (req, res) => {
    try {
        const contratos = await Contrato.findAll({ order: [['createdAt', 'DESC']] }); //
        res.json(contratos);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener el listado de contratos" });
    }
};

const Contrato = require('../models/Contrato');

exports.guardarContrato = async (req, res) => {
    try {
        const contrato = await Contrato.create(req.body);
        res.status(201).json({ success: true, data: contrato });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};