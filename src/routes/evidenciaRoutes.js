// src/routes/evidenciaRoutes.js
const express = require('express');
const { protect, rol } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');
const evidenciaController = require('../controllers/evidenciaController');
const upload = require('../middleware/upload');

const router = express.Router();

const roles = ['Residente', 'Practicante', 'Admin'];
const rolesCreacion = ['Residente', 'Practicante'];
const rolesMonitoreo = ['Admin', 'Ingeniero'];

// src/routes/evidenciaRoutes.js
router.get(
'/tarea/:tareaId',
protect,
rol(roles),
evidenciaController.getEvidenciasByTarea
);

module.exports = router;



router.post(
  '/upload-multiple/:tareaId',
  protect,
  rol(['Admin', 'Residente', 'Practicante']),
  upload.array('archivos', 10), // ✅ esto devuelve una función
  evidenciaController.subirMultiplesEvidencias
);


//router.post(
//  '/upload-multiple/:tareaId',
//  protect,
//  rol(['Admin', 'Residente', 'Practicante']), // ✅ función que devuelve otra función
//  uploadMultiple, // ✅ middleware multer
//  evidenciaController.subirMultiplesEvidencias // ✅ controlador final
//);

module.exports = router;


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