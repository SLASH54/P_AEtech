// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController'); // Necesario en el paso 2.3
const { protect, rol, admin } = require('../middleware/authMiddleware'); 
//const { saveFcmToken } = require('../controllers/userController');

const router = express.Router();

console.log('Tipo de userController.saveFcmToken:', typeof userController.saveFcmToken);


router.post('/me/fcm-token', protect, userController.saveFcmToken);

// 1. OBTENER TODOS LOS USUARIOS (Sólo Admin)
router.get('/', protect, admin, userController.getAllUsers); 

// 🔑 1.5. OBTENER UN SOLO USUARIO POR ID (SÓLO Admin) - ¡AÑADE ESTA LÍNEA!
router.get('/:id', protect, admin, userController.getUserById);

// 2. EDITAR USUARIO (Sólo Admin)
router.put('/:id', protect, admin, userController.updateUser); 

// 3. ELIMINAR USUARIO (Sólo Admin)
router.delete('/:id', protect, admin, userController.deleteUser); 

module.exports = router;