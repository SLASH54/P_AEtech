// src/routes/reporteRoutes.js
const express = require('express');
const reporteController = require('../controllers/reporteController');
const { protect, rol } = require('../middleware/authMiddleware'); 

const router = express.Router();

// Roles que pueden descargar el reporte (Admin, Residente, Ingeniero)
// Roles que pueden descargar el reporte (Admin, Residente, Ingeniero)
const rolesDescarga = ['Admin', 'Residente', 'Ingeniero']; 

// =============================================================
// RUTA PARA GENERAR Y DESCARGAR EL PDF
// =============================================================
// Se cambia .route().get() por .get() directo para manejar 
// mejor los parámetros del modal (?materiales=true&comentarios=false)
// =============================================================
router.get(
    '/pdf/:tareaId', 
    protect, 
    rol(rolesDescarga), 
    reporteController.generateReportePDF
);

module.exports = router;
