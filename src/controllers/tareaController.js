// src/controllers/tareaController.js
const { Tarea, Usuario, Actividad, Sucursal, ClienteNegocio, Notificacion } = require('../models/relations');
const { sequelize } = require('../config/database');
const { sendPushToUser } = require('../utils/push');
const admin = require("../config/firebaseadmin");
const { ClienteDireccion } = require('../models/relations');


// ===============================
// TAREA EXPRESS
// ===============================
// 1. El usuario crea la tarea con estado restringido
exports.solicitarTareaExpress = async (req, res) => {
    try {
        const { nombre, descripcion, actividadId, sucursalId, clienteNegocioId } = req.body;

        const nuevaTarea = await Tarea.create({
            nombre,
            descripcion,
            actividadId,
            sucursalId,
            clienteNegocioId,
            usuarioAsignadoId: req.user.id, // Se asigna a sí mismo automáticamente
            estado: 'Pendiente de Autorización', // Forzamos este estado
            prioridad: 'Normal'
        });

        // LÓGICA DE NOTIFICACIÓN PUSH AL ADMIN
        // Buscamos a los admins para enviarles la notificación
        const admins = await Usuario.findAll({ where: { rol: 'Admin' } });
        
        // Dentro de solicitarTareaExpress en tareaController.js
        //admins.forEach(async (adminUser) => {
            // 1. Enviar Push (ya lo tienes)
        //    if (adminUser.pushToken) { 
        //        sendPushToUser(adminUser.pushToken, {
        //            title: "Nueva Solicitud de Tarea",
        //            body: `${req.user.nombre} solicita crear la tarea: ${nombre}`,
        //            data: { tareaId: nuevaTarea.id.toString(), type: "AUTH_REQUIRED" }
        //        }); 
        //    }
            
            // 2. AGREGAR ESTO: Guardar en la tabla Notificacions para que aparezca en la campana
        //    await Notificacion.create({
        //        usuarioId: adminUser.id,
        //        tareaId: nuevaTarea.id,
        //        mensaje: `Nueva tarea express de ${req.user.nombre}: ${nombre}`,
        //        leida: false
        //    });
        //});

        res.status(201).json({ message: 'Solicitud enviada al administrador.', tarea: nuevaTarea });
    } catch (error) {
        res.status(500).json({ message: 'Error al solicitar tarea express.' });
    }
};

// 2. El Admin cambia el estado para "activar" la tarea
exports.autorizarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const tarea = await Tarea.findByPk(id);

        if (!tarea) return res.status(404).json({ message: 'Tarea no encontrada.' });

        tarea.estado = 'Pendiente'; // Al pasar a Pendiente, ya aparece en el flujo normal
        await tarea.save();

        res.json({ message: 'Tarea autorizada correctamente.', tarea });
    } catch (error) {
        res.status(500).json({ message: 'Error al autorizar tarea.' });
    }
};


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
// ===============================s
exports.createTarea = async (req, res) => {
    try {
       const { 
    nombre, descripcion, usuarioAsignadoId, actividadId, 
    sucursalId, clienteNegocioId, fechaLimite, prioridad 
} = req.body;

        
        // Validación de campos obligatorios
        if (!nombre || !usuarioAsignadoId || !actividadId || !sucursalId || !clienteNegocioId) {
            return res.status(400).json({ 
                message: 'Faltan campos requeridos (nombre, asignado, actividad, sucursal o cliente).' 
            });
        }

        // Crear la tarea
       const tarea = await Tarea.create({
    nombre,
    descripcion,        // 👈 AGREGADO
    usuarioAsignadoId,
    actividadId,
    sucursalId,
    clienteNegocioId,
    fechaLimite,
    prioridad
});

        // Obtener detalles de la tarea creada
        const tareaCreada = await Tarea.findByPk(tarea.id, { include: includeConfig });

        //✅ Crear notificación automática para el usuario asignado
      //await crearNotificacion(
  //usuarioAsignadoId,
  //tareaCreada.id,
  //`Se te ha asignado una nueva tarea: "${nombre}".`
//);

        

await Notificacion.create({
  usuarioId: usuarioAsignadoId,
  tareaId: tareaCreada.id,
  mensaje: `Tienes una nueva tarea: ${tareaCreada.nombre}`,
  leida: false
});

// ✅ 🔔 Enviar notificación Push FCM
    try {
      const usuarioAsignado = await Usuario.findByPk(usuarioAsignadoId);
      if (usuarioAsignado && usuarioAsignado.fcmToken) {
        const mensaje = {
          notification: {
            title: "Nueva tarea asignada",
            body: `Se te ha asignado la tarea: "${tareaCreada.nombre}".`,
          },
          token: usuarioAsignado.fcmToken,
        };
        await admin.messaging().send(mensaje);
        console.log("✅ Notificación FCM enviada a:", usuarioAsignado.nombre);
      } else {
        console.warn("⚠️ Usuario sin token FCM o no encontrado");
      }
    } catch (error) {
      console.error("❌ Error enviando notificación FCM:", error);
    }

    // 🔹 Responder al frontend
    return res.status(201).json({
      message: "Tarea asignada con éxito.",
      tarea: tareaCreada
    });

  } catch (error) {
    console.error("Error al crear tarea:", error);
    return res.status(500).json({
      message: "Error interno del servidor al crear la tarea."
    });
  }






//sendPushToUser(
//  usuarioAsignadoId,
//  'Nueva tarea asignada',
//  `${tareaCreada.nombre} · fecha límite: ${new Date(tareaCreada.fechaLimite).toLocaleDateString('es-MX')}`,
//  { tareaId: String(tareaCreada.id) }
//);
        
//      return res.status(201).json({ message: 'Tarea asignada con éxito.', tarea: tareaCreada });  
      
//      } catch (error) {
//        console.error('Error al crear tarea:', error);
//        return res.status(500).json({ message: 'Error interno del servidor al crear la tarea.' });
//    }
    
};


// ===============================
// 2. OBTENER TODAS LAS TAREAS (GET)
// ===============================
exports.getAllTareas = async (req, res) => {
  try {
    const tareas = await Tarea.findAll({
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    res.json(tareas);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ message: 'Error al obtener tareas' });
  }
};

// ===============================
// 3. OBTENER TAREAS ASIGNADAS (GET)
// ===============================
exports.getTareasAsignadas = async (req, res) => {
    try {
        // req.user.id fue adjuntado por el middleware 'protect'
        const tareas = await Tarea.findAll({
            where: { usuarioAsignadoId: req.user.id },
            include: includeConfig,
            order: [['prioridad', 'DESC'], ['fechaLimite', 'ASC']]
        });
        return res.json(tareas);
    } catch (error) {
        console.error('Error al obtener tareas asignadas:', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener las tareas asignadas.' });
    }
};

// ===============================
// 4. ACTUALIZAR TAREA (PUT)
// ===============================
exports.updateTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Tarea.update(req.body, { where: { id } });

    if (!updated) return res.status(404).json({ message: 'Tarea no encontrada.' });

    const tareaActualizada = await Tarea.findByPk(id, { include: includeConfig });

    // ✅ Si la tarea se marca como COMPLETADA → eliminar notificaciones
    if (tareaActualizada.estado === 'Completada') {
      await Notificacion.destroy({ where: { tareaId: id } });
      console.log(`🧹 Notificaciones eliminadas para tarea completada ID: ${id}`);
    }

    res.json({ message: 'Tarea actualizada con éxito.', tarea: tareaActualizada });

  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar la tarea.' });
  }
};

// ===============================
// 5. ELIMINAR TAREA (DELETE)
// ===============================
exports.deleteTarea = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Eliminar evidencias relacionadas
    await sequelize.query(`DELETE FROM "Evidencias" WHERE "tareaId" = ${id}`);

    // 🔹 Eliminar notificaciones vinculadas
    await sequelize.query(`DELETE FROM "Notificacions" WHERE "tareaId" = ${id}`);
    //await Notificacion.destroy({ where: { id } });
    console.log(`🧹 Notificaciones eliminadas para tarea eliminada ID: ${id}`);

    // 🔹 Eliminar la tarea
    const deleted = await Tarea.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Tarea no encontrada.' });

    res.json({ message: 'Tarea, evidencias y notificaciones eliminadas correctamente.' });

  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar la tarea.' });
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


