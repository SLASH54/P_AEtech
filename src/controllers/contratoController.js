const Contrato = require('../models/Contrato');

exports.crearContrato = async (req, res) => {
    try {
        const { clienteNombre, clienteRFC, clienteDomicilio, firmaData } = req.body;
        
        const nuevoContrato = await Contrato.create({
            clienteNombre,
            clienteRFC,
            clienteDomicilio,
            firmaData // La firma que viene del canvas
        });

        res.status(201).json({ msg: "Contrato guardado con éxito", id: nuevoContrato.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al guardar contrato" });
    }
};

exports.obtenerContratos = async (req, res) => {
    try {
        const contratos = await Contrato.findAll({ order: [['createdAt', 'DESC']] });
        res.json(contratos);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener listado" });
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