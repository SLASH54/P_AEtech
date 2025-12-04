// src/routes/notificacionRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notificacionController = require('../controllers/notificacionController');

// 🟡 Obtener solo notificaciones NO leídas del usuario logueado
// GET /api/notificaciones
router.get(
  '/',
  protect,
  notificacionController.getNotificacionesNoLeidas
);

// 🟢 (Opcional) Obtener TODAS las notificaciones del usuario
// GET /api/notificaciones/all
router.get(
  '/all',
  protect,
  notificacionController.getNotificacionesUsuario
);

// 🟢 Marcar una notificación específica como leída
// PUT /api/notificaciones/:id/leida
router.put(
  '/:id/leida',
  protect,
  notificacionController.marcarLeida
);

// 🟢 Marcar como leídas las notificaciones de una tarea
// PUT /api/notificaciones/mark-read-by-tarea/:tareaId
router.put(
  '/mark-read-by-tarea/:tareaId',
  protect,
  notificacionController.markReadByTarea
);

// 🟢 Eliminar una notificación
// DELETE /api/notificaciones/:id
router.delete(
  '/:id',
  protect,
  notificacionController.eliminarNotificacion
);

// 🧹 Limpieza (sigue deshabilitada)
router.delete(
  '/clean-orphans',
  protect,
  notificacionController.cleanOrphanNotificaciones
);

module.exports = router;
