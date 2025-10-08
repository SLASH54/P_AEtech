// src/routes/evidenciaRoutes.js
const express = require('express');
const evidenciaController = require('../controllers/evidenciaController');
const { protect, rol } = require('../middleware/authMiddleware'); 

const router = express.Router();

const rolesCreacion = ['Residente', 'Practicante'];
const rolesMonitoreo = ['Admin', 'Ingeniero'];

// Rutas Generales de Evidencia
router.route('/')
    // POST: Crear Evidencia (Completar Tarea) - Solo Residente/Practicante
    .post(protect, rol(rolesCreacion), evidenciaController.createEvidencia)
    // GET: Listar TODAS las Evidencias (Monitoreo) - Solo Admin/Ingeniero
    .get(protect, rol(rolesMonitoreo), evidenciaController.getAllEvidencias); 

// Ruta para obtener la evidencia de una Tarea específica
router.route('/tarea/:tareaId')
    // GET: Obtener Evidencia por Tarea ID - Admin, Ingeniero, y el Autor de la Evidencia (no se comprueba autor aquí por simplicidad, pero está protegido)
    .get(protect, evidenciaController.getEvidenciaByTareaId); 

module.exports = router;