const express = require('express');
const clienteController = require('../controllers/clienteNegocioController');
const { protect, rol ,admin } = require('../middleware/authMiddleware');

const ClienteNegocio = require('../models/ClienteNegocio');
const ClienteDireccion = require('../models/ClienteDireccion');
// Definimos quiénes pueden gestionar clientes
const rolesPermitidos = ['Admin', 'Ingeniero'];

const router = express.Router();

// Rutas CRUD principales
//.post('/', protect, admin, clienteController.createClienteNegocio);
//router.get('/', protect, admin, clienteController.getAllClientesNegocio);
//router.get('/:id', protect, admin, clienteController.getClienteNegocioById);
//router.put('/:id', protect, admin, clienteController.updateClienteNegocio);
//router.delete('/:id', protect, admin, clienteController.deleteClienteNegocio);

// Rutas CRUD principales actualizadas
router.post('/', protect, rol(rolesPermitidos), clienteController.createClienteNegocio);
router.get('/', protect, rol(rolesPermitidos), clienteController.getAllClientesNegocio);
router.get('/:id', protect, rol(rolesPermitidos), clienteController.getClienteNegocioById);
router.put('/:id', protect, rol(rolesPermitidos), clienteController.updateClienteNegocio);
router.delete('/:id', protect, rol(rolesPermitidos), clienteController.deleteClienteNegocio); // Borrar quizás solo Admin

// ✔ RUTA CORRECTA PARA OBTENER MÚLTIPLES DIRECCIONES
router.get('/:id/direcciones', protect, rol(rolesPermitidos), async (req, res) => {
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
