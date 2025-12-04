// src/controllers/tareaController.js
const { Tarea, Usuario, Actividad, Sucursal, ClienteNegocio, Notificacion } = require('../models/relations');
const { sequelize } = require('../config/database');
const { sendPushToUser } = require('../utils/push');
const admin = require("../config/firebaseadmin");
const { ClienteDireccion } = require('../models/relations');


// ===============================
// CONFIGURACIÓN DE INCLUSIÓN
// ===============================
const includeConfig = [
    { model: Usuario, as: 'AsignadoA', attributes: ['id', 'nombre', 'rol'] },
    { model: Actividad, attributes: ['id', 'nombre', 'campos_evidencia'] },
    { model: Sucursal, attributes: ['id', 'nombre', 'direccion'] },
    {
        model: ClienteNegocio,
        attributes: ['id', 'nombre', 'email', 'telefono'],
        include: [
            {
                model: ClienteDireccion,
                as: "direcciones",
                attributes: ["id", "direccion", "maps", "estado", "municipio"]
            }
        ]
    }
];





// ===============================
// 1. CREAR TAREA (POST)
// ===============================
exports.createTarea = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      usuarioAsignadoId,
      actividadId,
      sucursalId,
      clienteNegocioId,
      fechaLimite,
      prioridad,
    } = req.body;

    // Validación de campos obligatorios
    if (
      !nombre ||
      !usuarioAsignadoId ||
      !actividadId ||
      !sucursalId ||
      !clienteNegocioId
    ) {
      return res.status(400).json({
        message:
          'Faltan campos requeridos (nombre, asignado, actividad, sucursal o cliente).',
      });
    }

    // Crear la tarea
    const tarea = await Tarea.create({
      nombre,
      descripcion,
      usuarioAsignadoId,
      actividadId,
      sucursalId,
      clienteNegocioId,
      fechaLimite,
      prioridad,
    });

    // Obtener detalles con includes
    const tareaCreada = await Tarea.findByPk(tarea.id, {
      include: includeConfig,
    });

    // ✅ Crear notificación en BD con helper
    await crearNotificacion(
      usuarioAsignadoId,
      tareaCreada.id,
      `Se te ha asignado una nueva tarea: "${tareaCreada.nombre}".`
    );

    // ✅ 🔔 Enviar notificación Push FCM
    try {
      const usuarioAsignado = await Usuario.findByPk(usuarioAsignadoId);
      if (usuarioAsignado && usuarioAsignado.fcmToken) {
        const mensaje = {
          notification: {
            title: 'Nueva tarea asignada',
            body: `Se te ha asignado la tarea: "${tareaCreada.nombre}".`,
          },
          token: usuarioAsignado.fcmToken,
        };
        await admin.messaging().send(mensaje);
        console.log(
          '✅ Notificación FCM enviada a:',
          usuarioAsignado.nombre
        );
      } else {
        console.warn('⚠️ Usuario sin token FCM o no encontrado');
      }
    } catch (error) {
      console.error('❌ Error enviando notificación FCM:', error);
    }

    return res.status(201).json({
      message: 'Tarea asignada con éxito.',
      tarea: tareaCreada,
    });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al crear la tarea.',
    });
  }
};

// ===============================
// 5. ELIMINAR TAREA (DELETE)
// ===============================
exports.deleteTarea = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Eliminar evidencias relacionadas (si mantienes esta tabla)
    await sequelize.query(`DELETE FROM "Evidencias" WHERE "tareaId" = ${id}`);

    // 🔹 Eliminar notificaciones vinculadas usando el modelo
    await Notificacion.destroy({ where: { tareaId: id } });
    console.log(`🧹 Notificaciones eliminadas para tarea ID: ${id}`);

    // 🔹 Eliminar la tarea
    const deleted = await Tarea.destroy({ where: { id } });
    if (!deleted)
      return res.status(404).json({ message: 'Tarea no encontrada.' });

    res.json({
      message: 'Tarea, evidencias y notificaciones eliminadas correctamente.',
    });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({
      message: 'Error interno del servidor al eliminar la tarea.',
    });
  }
};




// ===============================
// 6. FUNCIÓN INTERNA: CREAR NOTIFICACIÓN
// ===============================
async function crearNotificacion(usuarioId, tareaId, mensaje) {
  try {
    await Notificacion.create({
      usuarioId,
      tareaId,
      mensaje,
      leida: false
    });

    console.log(`📩 Notificación creada para usuario ${usuarioId} en tarea ${tareaId}`);
  } catch (error) {
    console.error("❌ Error al crear notificación:", error);
  }
}


