// src/routes/sucursalRoutes.js
const express = require('express');
const sucursalController = require('../controllers/sucursalController');
const { protect, rol } = require('../middleware/authMiddleware'); 

const router = express.Router();

// Permisos basados en tu matriz y lógica de negocio:

// POST /api/sucursales (Crear): Solo Admin e Ingeniero
router.post(
    '/', 
    protect, 
    rol(['Admin', 'Ingeniero']), // Aplicación de permisos
    sucursalController.createSucursal
);

// GET /api/sucursales (Listar Todas): Admin, Ingeniero y Residente necesitan verlas
router.get(
    '/',
    protect,
    rol(['Admin', 'Ingeniero', 'Residente']), // Aplicación de permisos
    sucursalController.getAllSucursales
);

// PUT /api/sucursales/:id (Actualizar): Solo Admin e Ingeniero
router.put(
    '/:id', 
    protect, 
    rol(['Admin', 'Ingeniero']), // Aplicación de permisos
    sucursalController.updateSucursal
);

// DELETE /api/sucursales/:id (Eliminar): Solo Admin
router.delete(
    '/:id', 
    protect, 
    rol(['Admin']), // Aplicación de permisos
    sucursalController.deleteSucursal
);

module.exports = router;