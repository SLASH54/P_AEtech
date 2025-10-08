// src/routes/uploadRoutes.js
const express = require('express');
const uploadController = require('../controllers/uploadController');
const { protect, rol } = require('../middleware/authMiddleware');

const router = express.Router();

// Solo el personal de campo y Admin/Ingeniero pueden subir fotos de evidencia
const rolesUpload = ['Admin', 'Ingeniero', 'Residente', 'Practicante'];

// Ruta para subir una foto de evidencia.
router.post(
    '/',
    protect, 
    rol(rolesUpload), 
    uploadController.uploadSinglePhoto, // Multer sube el archivo al disco
    uploadController.handlePhotoUpload // Devuelve la ruta al cliente
);

module.exports = router;