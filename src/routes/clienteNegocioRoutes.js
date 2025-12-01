// src/routes/clienteNegocioRoutes.js
const express = require('express');
const clienteController = require('../controllers/clienteNegocioController');
const { protect, admin } = require('../middleware/authMiddleware'); // Usamos el middleware 'admin'

const router = express.Router();

// Todas estas rutas son solo para el Admin
router.post('/', protect, admin, clienteController.createClienteNegocio);
router.get('/', protect, admin, clienteController.getAllClientesNegocio);
router.get('/:id', protect, admin, clienteController.getClienteNegocioById);
router.put('/:id', protect, admin, clienteController.updateClienteNegocio);
router.delete('/:id', protect, admin, clienteController.deleteClienteNegocio);

router.get('/:id/direcciones', protect, admin, async (req, res) => {
    try {
        const clienteId = req.params.id;
        const cliente = await ClienteNegocio.findOne({
            where: { id: clienteId },
            include: [{ model: ClienteDireccion, as: "direcciones" }]
        });

        if (!cliente) return res.json({ direcciones: [] });

        res.json(cliente.direcciones);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error obteniendo direcciones del cliente" });
    }
});



module.exports = router;

// Obtener direcciones del cliente seleccionado
router.get('/:id/direcciones', protect, admin, async (req, res) => {
    try {
        const clienteId = req.params.id;

        // --- IMPORTANTE ---
        // Asegúrate de importar el modelo ClienteNegocio arriba:
        // const ClienteNegocio = require('../models/ClienteNegocio');

        const cliente = await ClienteNegocio.findByPk(clienteId);

        if (!cliente) return res.json({ direcciones: [] });

        res.json({ direcciones: cliente.direcciones || [] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error obteniendo direcciones de cliente" });
    }
});



