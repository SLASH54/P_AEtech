// src/controllers/tareaController.js
const { Tarea, Usuario, Actividad, Sucursal, ClienteNegocio, Notificacion } = require('../models/relations');
const { sequelize } = require('../config/database');
const { sendPushToUser } = require('../utils/push');
const admin = require("../config/firebaseadmin");
const { ClienteDireccion } = require('../models/relations');


// ===============================
// TAREA EXPRESS
// ===============================
exports.solicitarTareaExpress = async (req, res) => {
    try {
        const { nombre, descripcion, actividadId, sucursalId, clienteNegocioId, direccionClienteId, fechaLimite, } = req.body;

        // Aseguramos que el ID del usuario sea un número
        // Si req.user.id es "admin", esto fallará, por eso usamos Number()
        // 🔴 CORRECCIÓN AQUÍ:
        // En lugar de forzar parseInt, verificamos que el ID exista en el token
        if (!req.user || !req.user.id) {
            return res.status(400).json({ message: "Sesión inválida: No se encontró el ID de usuario." });
        }

        const userId = req.user.id; // Ya no usamos parseInt forzoso aquí para evitar el NaN

        // 1. Buscamos el nombre del usuario que está haciendo la solicitud
        const solicitante = await Usuario.findByPk(userId);
        
        if (!solicitante) {
            return res.status(404).json({ message: "Usuario solicitante no encontrado en la base de datos." });
        }

        const nombreSolicitante = solicitante.nombre;

        // Si mandas fecha desde el front, conviértela a objeto Date primero
        const fechaFormateada = new Date().toISOString().split('T')[0]; // Esto da 2026-01-08

        const nuevaTarea = await Tarea.create({
            nombre: nombre,
            descripcion: descripcion,
            actividadId: parseInt(actividadId),
            sucursalId: parseInt(sucursalId),
            clienteNegocioId: parseInt(clienteNegocioId),
            direccionClienteId: parseInt(direccionClienteId),
            usuarioAsignadoId: userId, 
            // USAREMOS 'Pendiente' por ahora para evitar el error de ENUM en la DB
            estado: 'Pendiente de Autorización', 
            fechaLimite: fechaFormateada,
            prioridad: 'Normal'
            
        });

         await Notificacion.create({
      usuarioId: nuevaTarea.usuarioAsignadoId,
      tareaId: nuevaTarea.id,
      mensaje: `Tienes una nueva tarea: ${nuevaTarea.nombre}`,
      leida: false
    });

        // LÓGICA DE NOTIFICACIÓN PUSH AL ADMIN
        // Buscamos a los admins para enviarles la notificación
        const admins = await Usuario.findAll({ where: { rol: 'Admin' } });
        // 2. Buscamos específicamente a Denisse (ID 37) por si no es Admin
        const denisse = await Usuario.findByPk(37);

        
        // 3. Juntamos a todos en una lista única (usamos Map para no repetir si el Admin ya es Denisse)
const destinatarios = new Map();
admins.forEach(a => destinatarios.set(a.id, a));
if (denisse) destinatarios.set(denisse.id, denisse);

// 4. Enviamos a cada uno (Solo una vez)
destinatarios.forEach(async (user) => {
    try {
        // --- ENVÍO PUSH ---
        // Usamos tu función centralizada de push.js que ya maneja el token internamente
        await sendPushToUser(
            user.id, 
            "Nueva Solicitud de Tarea", 
            `${nombreSolicitante} solicita crear la tarea: ${nombre}`,
            { tareaId: nuevaTarea.id.toString(), type: "AUTH_REQUIRED" }
        );

        // --- GUARDAR EN BASE DE DATOS (Para la campanita) ---
        await Notificacion.create({
            usuarioId: user.id,
            tareaId: nuevaTarea.id,
            mensaje: `Nueva solicitud de tarea express de ${nombreSolicitante}: ${nombre}`,
            leida: false
        });

        console.log(`✅ Notificación y registro creado para: ${user.nombre}`);
    } catch (error) {
        console.error(`❌ Error con usuario ${user.id}:`, error);
    }
});

        // Una vez creada la tarea, podemos intentar enviar las notificaciones
        // (Te recomiendo descomentarlas una por una para ver cuál falla)
        
        return res.status(201).json({ 
            message: "Tarea express creada correctamente", 
            tareaId: nuevaTarea.id 
        });

    } catch (error) {
        console.error("Error en solicitarTareaExpress:", error);
        return res.status(500).json({ 
            message: "Error al crear la tarea", 
            detalle: error.message 
        });
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


        sendPushToUser(
          tarea.usuarioAsignadoId,
          'Tarea Autorizada',
          `Ya puedes Trabajar en ella: ${tarea.nombre}`,
        );

        // ✅ 🔔 Enviar notificación Push FCM
        try {
      const usuarioAsignado = await Usuario.findByPk(usuarioAsignadoId);
      if (usuarioAsignado && usuarioAsignado.fcmToken) {
        const mensaje = {
          notification: {
            title: "Tarea Autorizada",
            body: `Ya puedes Trabajar en la tarea: "${tarea.nombre}".`,
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
    sucursalId, clienteNegocioId, direccionClienteId, fechaLimite, prioridad,
      direccion, cliente_Nombre,      // Texto si es express
      es_express
} = req.body;

    let finalClienteId = clienteNegocioId;
    let finalDireccionId = direccionClienteId; // El ID que venga por defecto

    // 🚀 LÓGICA EXPRESS: Si el cliente no existe, lo creamos ahorita
    if (es_express) {
      console.log("🛠 Creando cliente y dirección express para Tarea...");
      
      // 1. Crear el Negocio/Cliente
      const nuevoNegocio = await ClienteNegocio.create({
        nombre: cliente_Nombre,
        email: `express_${Date.now()}@aetech.com`, // Email único temporal
        telefono: "0000000000"
        // Puedes agregar campos por defecto si tu modelo los pide
      });

      // 2. Crear la Dirección asociada a ese nuevo negocio
      const nuevaDireccion = await ClienteDireccion.create({
        clienteId: nuevoNegocio.id,
        estado: "N/A", 
        municipio: "N/A",
        direccion: direccion,
        alias: "Registro Express"
      });

      finalClienteId = nuevoNegocio.id;
      finalDireccionId = nuevaDireccion.id;
    }

        
        // Validación de campos obligatorios
        if (!nombre || !usuarioAsignadoId || !actividadId || !sucursalId) {
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
    clienteNegocioId: finalClienteId,
    direccionClienteId: finalDireccionId,
    fechaLimite,
    prioridad
});

        // Obtener detalles de la tarea creada
        const tareaCreada = await Tarea.findByPk(tarea.id, { include: includeConfig });

        //✅ Crear notificación automática para el usuario asignado
    

        

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


exports.enviarRecordatorioPush = async (req, res) => {
    const { id } = req.params; // ID de la tarea

    try {
        // Buscamos la tarea y el usuario asignado
        const tarea = await Tarea.findByPk(id, {
            include: [{ model: Usuario, as: "AsignadoA" }]
        });

        if (!tarea || !tarea.AsignadoA) {
            return res.status(404).json({ error: "No hay un técnico asignado a esta tarea" });
        }

        const titulo = "📌 Recordatorio de Tarea";
        const mensaje = `no olvides revisar la tarea: ${tarea.nombre || 'Sin título'}`;

        // Enviamos la push usando tu archivo push.js
        await sendPushToUser(tarea.AsignadoA.id, titulo, mensaje, { tareaId: id });

        res.json({ success: true, message: "Recordatorio enviado" });
    } catch (error) {
        res.status(500).json({ error: "Error al enviar el recordatorio" });
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


