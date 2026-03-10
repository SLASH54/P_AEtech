// src/controllers/notificacionController.js
const { Notificacion } = require('../models/relations');

// 🟢 Todas las notificaciones del usuario (si las necesitas)
exports.getNotificacionesUsuario = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const notificaciones = await Notificacion.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']],
    });
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

// 🟡 Solo no leídas (esta será la ruta principal GET /api/notificaciones)
//exports.getNotificacionesNoLeidas = async (req, res) => {
//  try {
//    const usuarioId = req.user.id;
//    const notificaciones = await Notificacion.findAll({
//      where: { usuarioId, leida: false },
//      order: [['createdAt', 'DESC']],
//    });
//    res.json(notificaciones);
//  } catch (error) {
//    console.error('Error al obtener notificaciones no leídas:', error);
//    res.status(500).json({ message: 'Error al cargar notificaciones' });
//  }
//};

// 🟢 Marcar todas las notificaciones de una tarea como leídas
exports.markReadByTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;
    await Notificacion.update(
      { leida: true },
      { where: { tareaId } }
    );
    res.json({ message: '✅ Notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar notificación como leída por tarea:', error);
    res.status(500).json({ message: 'Error al marcar notificación' });
  }
};

// 🟢 Marcar una sola notificación como leída
exports.marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const notificacion = await Notificacion.findByPk(id);

    if (!notificacion) {
      return res.status(404).json({ message: 'Notificación no encontrada.' });
    }

    notificacion.leida = true;
    await notificacion.save();

    res.json({ message: 'Notificación marcada como leída.' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// 🟢 Eliminar una notificación
exports.eliminarNotificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notificacion.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Notificación no encontrada.' });
    }
    res.json({ message: 'Notificación eliminada.' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// 🧹 Limpieza deshabilitada (la dejamos igual)
exports.cleanOrphanNotificaciones = async (req, res) => {
  try {
    //console.log('🧹 Limpieza de notificaciones deshabilitada temporalmente.');
    return res.json({
      message: 'Limpieza de notificaciones deshabilitada temporalmente.',
      eliminadas: 0,
    });
  } catch (err) {
    console.error('❌ Error limpiando notificaciones (deshabilitada):', err);
    return res.status(500).json({
      message: 'Error limpiando notificaciones (deshabilitada).',
      error: err.message,
    });
  }
};
