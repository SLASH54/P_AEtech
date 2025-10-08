// src/routes/clienteNegocioRoutes.js
const express = require('express');
const clienteController = require('../controllers/clienteNegocioController');
const { protect, admin } = require('../middleware/authMiddleware'); // Usamos el middleware 'admin'

const router = express.Router();

// Todas estas rutas son solo para el Admin
router.post('/', protect, admin, clienteController.createClienteNegocio);
router.get('/', protect, admin, clienteController.getAllClientesNegocio);
router.put('/:id', protect, admin, clienteController.updateClienteNegocio);
router.delete('/:id', protect, admin, clienteController.deleteClienteNegocio);

module.exports = router;