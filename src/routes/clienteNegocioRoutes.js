const express = require('express');
const clienteController = require('../controllers/clienteNegocioController');
const { protect, admin } = require('../middleware/authMiddleware');

const ClienteNegocio = require('../models/ClienteNegocio');
const ClienteDireccion = require('../models/ClienteDireccion');

const router = express.Router();

// Rutas CRUD principales
router.post('/', protect, admin, clienteController.createClienteNegocio);
router.get('/', protect, admin, clienteController.getAllClientesNegocio);
router.get('/:id', protect, admin, clienteController.getClienteNegocioById);
router.put('/:id', protect, admin, clienteController.updateClienteNegocio);
router.delete('/:id', protect, admin, clienteController.deleteClienteNegocio);

// ✔ RUTA CORRECTA PARA OBTENER MÚLTIPLES DIRECCIONES
router.get('/:id/direcciones', protect, admin, async (req, res) => {
    try {
        const clienteId = req.params.id;

        const cliente = await ClienteNegocio.findOne({
            where: { id: clienteId },
            include: [{ model: ClienteDireccion, as: "direcciones" }]
        });

        if (!cliente) {
            return res.json([]);
        }

        res.json(cliente.direcciones);

    } catch (err) {
        console.error("ERROR RUTA /direcciones:", err);
        res.status(500).json({ error: "Error obteniendo direcciones" });
    }
});

module.exports = router;
