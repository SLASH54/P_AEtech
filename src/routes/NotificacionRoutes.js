// src/routes/notificacionRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notificacionController = require('../controllers/notificacionController');



// 🟢 Marcar como leídas las notificaciones de una tarea completada o eliminada
router.put('/mark-read-by-tarea/:tareaId', protect, notificacionController.markReadByTarea);

// 🟡 Obtener solo notificaciones no leídas
router.get('/', protect, notificacionController.getNotificacionesNoLeidas);

router.delete('/clean-orphans', protect, notificacionController.cleanOrphanNotificaciones);



// 🔹 Obtener notificaciones del usuario logueado
router.get('/', protect, notificacionController.getNotificacionesUsuario);

// 🔹 Marcar una notificación como leída
router.put('/:id/leida', protect, notificacionController.marcarLeida);

router.put('/mark-read-by-tarea/:tareaId', protect, notificacionController.markReadByTarea);


// 🔹 Eliminar notificación
router.delete('/:id', protect, notificacionController.eliminarNotificacion);

module.exports = router;
