// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController'); // Necesario en el paso 2.3
const { protect, admin } = require('../middleware/authMiddleware'); 

const router = express.Router();

// 1. OBTENER TODOS LOS USUARIOS (Sólo Admin)
router.get('/', protect, admin, userController.getAllUsers); 

// 2. EDITAR USUARIO (Sólo Admin)
router.put('/:id', protect, admin, userController.updateUser); 

// 3. ELIMINAR USUARIO (Sólo Admin)
router.delete('/:id', protect, admin, userController.deleteUser); 

module.exports = router;