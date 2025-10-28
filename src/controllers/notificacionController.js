// src/controllers/notificacionController.js
const { Notificacion } = require('../models/relations');

// 🟢 Obtener todas las notificaciones del usuario logueado
exports.getNotificacionesUsuario = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const notificaciones = await Notificacion.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']]
    });
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

// 🟢 Marcar una notificación como leída
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
    if (!deleted) return res.status(404).json({ message: 'No encontrada.' });
    res.json({ message: 'Notificación eliminada.' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
