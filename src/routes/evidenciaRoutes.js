// src/routes/evidenciaRoutes.js
const express = require('express');
const { protect, rol } = require('../middleware/authMiddleware');
const evidenciaController = require('../controllers/evidenciaController');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Definición de roles
const rolesCreacion = ['Residente', 'Practicante'];
const rolesMonitoreo = ['Admin', 'Ingeniero'];

// =============================================================
// 📸 RUTA PARA SUBIR MÚLTIPLES EVIDENCIAS CON MULTER
// =============================================================
router.post(
  '/upload-multiple/:tareaId',
  protect,
  rol(['Admin', 'Residente', 'Practicante']),
  upload.array('archivos', 10), // ✅ función correcta de Multer
  evidenciaController.subirMultiplesEvidencias
);

// =============================================================
// 📋 RUTAS GENERALES DE EVIDENCIAS
// =============================================================

// 1️⃣ Crear nueva evidencia (técnicos o practicantes)
router.post('/', protect, rol(rolesCreacion), evidenciaController.createEvidencia);

// 2️⃣ Listar todas las evidencias (solo Admin/Ingeniero)
router.get('/', protect, rol(rolesMonitoreo), evidenciaController.getAllEvidencias);

// 3️⃣ Obtener evidencias por tarea ID (lectura general)
router.get('/tarea/:tareaId', protect, evidenciaController.getEvidenciaByTareaId);

// 4️⃣ Obtener lista de evidencias de una tarea (para técnicos)
router.get('/tarea/:tareaId/list', protect, rol(['Admin', 'Residente', 'Practicante']), evidenciaController.getEvidenciasByTarea);

module.exports = router;
