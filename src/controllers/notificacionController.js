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




exports.markReadByTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;
    await Notificacion.update({ leida: true }, { where: { tareaId } });
    res.json({ message: '✅ Notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ message: 'Error al marcar notificación' });
  }
};

exports.getNotificacionesNoLeidas = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { usuarioId: req.user.id, leida: false },
      order: [['createdAt', 'DESC']]
    });
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error al cargar notificaciones' });
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



// ✅ Limpia notificaciones de tareas que ya no existen o están completadas
exports.cleanOrphanNotificaciones = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM "Notificacions"
      WHERE "tareaId" IS NOT NULL
      AND (
        "tareaId" NOT IN (SELECT "id" FROM "Tareas")
        OR "tareaId" IN (
          SELECT "id" FROM "Tareas" WHERE "estado" = 'Completada'
        )
      )
      RETURNING *;
    `);

    console.log(`🧹 ${result?.length || 0} notificaciones obsoletas eliminadas.`);
    res.json({ message: 'Notificaciones antiguas eliminadas.', eliminadas: result?.length || 0 });
  } catch (err) {
    console.error('❌ Error limpiando notificaciones:', err);
    res.status(500).json({ message: 'Error limpiando notificaciones.', error: err.message });
  }
};
