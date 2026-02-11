// src/routes/reporteRoutes.js
const express = require('express');
const reporteController = require('../controllers/reporteController');
const { protect, rol } = require('../middleware/authMiddleware'); 

const router = express.Router();

// Roles que pueden descargar el reporte (Admin, Residente, Ingeniero)
const rolesDescarga = ['Admin', 'Residente', 'Ingeniero']; 

// Ruta para generar y descargar el PDF de una Tarea completada
router.route('/pdf/:tareaId')
    // El método GET debe devolver el archivo PDF
    .get(protect, rol(rolesDescarga), reporteController.generarPDFTarea);

module.exports = router;
