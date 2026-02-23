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
    // 🔥 CAMBIO CLAVE: Solo parsear si el valor existe, si no, mandar null
    actividadId: actividadId ? parseInt(actividadId) : null,
    sucursalId: sucursalId ? parseInt(sucursalId) : null,
    clienteNegocioId: clienteNegocioId ? parseInt(clienteNegocioId) : null,
    direccionClienteId: direccionClienteId ? parseInt(direccionClienteId) : null,
    
    // El usuario asignado se maneja en la tabla intermedia abajo, 
    // pero dejamos este por compatibilidad si tu modelo lo pide
    usuarioAsignadoId: Array.isArray(usuarioAsignadoId) ? null : usuarioAsignadoId, 
    
    estado: 'Pendiente de Autorización', 
    fechaLimite: fechaFormateada || null,
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
            { 
                click_action: "https://aetechprueba.netlify.app/sistema.html", // O la ruta específica de la tarea
            }
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
          { 
              click_action: "https://aetechprueba.netlify.app/sistema.html", // O la ruta específica de la tarea
          }
        );

        


    } catch (error) {
        res.status(500).json({ message: 'Error al autorizar tarea.' });
    }
};


// ===============================
// CONFIGURACIÓN DE INCLUSIÓN
// ===============================
const includeConfig = [
    // 🚀 AGREGA ESTA LÍNEA AQUÍ:
    { model: Usuario, as: 'usuarios', attributes: ['id', 'nombre', 'rol'] },

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
            direccion, cliente_Nombre, es_express 
        } = req.body;

        let finalClienteId = clienteNegocioId;
        let finalDireccionId = direccionClienteId;

        // 🚀 LÓGICA EXPRESS: Si el cliente no existe, lo creamos
        if (es_express) {
            console.log("🛠 Creando cliente y dirección express para Tarea...");
            const nuevoNegocio = await ClienteNegocio.create({
                nombre: cliente_Nombre,
                email: `express_${Date.now()}@aetech.com`,
                telefono: "0000000000"
            });

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

        // 🔍 VALIDACIÓN Y LIMPIEZA DE IDs
        // Si viene un array vacío o un string vacío, evitamos que truene la DB
        const idsArray = Array.isArray(usuarioAsignadoId) 
            ? usuarioAsignadoId.filter(id => id !== "" && id !== null) 
            : (usuarioAsignadoId ? [usuarioAsignadoId] : []);

        if (!nombre || idsArray.length === 0 || !actividadId || !sucursalId) {
            return res.status(400).json({ 
                message: 'Faltan campos requeridos (nombre, al menos un asignado, actividad o sucursal).' 
            });
        }

        // 1. Crear la tarea
        // Para el campo viejo 'usuarioAsignadoId', guardamos el primero o null si no hay
        const tarea = await Tarea.create({
            nombre,
            descripcion,
            usuarioAsignadoId: idsArray[0] || null, 
            actividadId,
            sucursalId,
            clienteNegocioId: finalClienteId,
            direccionClienteId: finalDireccionId,
            fechaLimite,
            prioridad,
            estado: 'Pendiente'
        });

        // 2. 🔥 VINCULAR TODOS LOS USUARIOS SELECCIONADOS (Tabla intermedia)
        await tarea.setUsuarios(idsArray); 

        // 3. 🔔 BUCLE DE NOTIFICACIONES
        for (const uId of idsArray) {
            // Notificación en DB
            await Notificacion.create({
                usuarioId: uId,
                tareaId: tarea.id,
                mensaje: `Tienes una nueva tarea: ${nombre}`,
                leida: false
            });

            // Push FCM
            try {
                const user = await Usuario.findByPk(uId);
                if (user && user.fcmToken) {
                    const mensajePush = {
                        notification: { 
                            title: "Nueva tarea asignada", 
                            body: `Se te ha asignado: ${nombre}` 
                        },
                        data: {
                            click_action: "https://aetechprueba.netlify.app/sistema.html?open=tareas"
                        },
                        token: user.fcmToken
                    };
                    await admin.messaging().send(mensajePush);
                    console.log(`✅ Push enviada a: ${user.nombre}`);
                }
            } catch (e) { 
                console.error(`❌ Error enviando push al usuario ${uId}:`, e.message); 
            }
        }

        // Obtener tarea completa para responder al frontend
        const tareaFinal = await Tarea.findByPk(tarea.id, {
            include: [
                { model: Usuario, as: 'usuarios', attributes: ['id', 'nombre'] },
                { model: Actividad },
                { model: Sucursal }
            ]
        });

        return res.status(201).json({
            message: "Tarea creada y asignada con éxito.",
            tarea: tareaFinal
        });

    } catch (error) {
        console.error("🚨 Error al crear tarea:", error);
        return res.status(500).json({
            message: "Error interno al crear la tarea.",
            error: error.message
        });
    }
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
        const tareas = await Tarea.findAll({
            include: [
                {
                    model: Usuario,
                    as: 'usuarios',
                    where: { id: req.user.id }, // <--- Esto filtra si el usuario está en la lista
                    attributes: ['id', 'nombre']
                },
                // El resto de los modelos (puedes usar ...includeConfig si quieres)
                { model: Actividad },
                { model: Sucursal },
                { model: ClienteNegocio }
            ],
            order: [['prioridad', 'DESC'], ['fechaLimite', 'ASC']]
        });
        return res.json(tareas);
    } catch (error) {
        console.error('Error al obtener tareas asignadas:', error);
        return res.status(500).json({ message: 'Error al obtener tareas.' });
    }
};


// ===============================
// OBTENER TAREA POR ID (Para el Modal de Edición) 4.1
// ===============================
exports.getTareaById = async (req, res) => {
    try {
        const { id } = req.params;
        const tarea = await Tarea.findByPk(id, { 
            include: includeConfig // includeConfig ya tiene 'usuarios' y 'ClienteNegocio'
        });
        if (!tarea) return res.status(404).json({ message: 'Tarea no encontrada' });
        res.json(tarea);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la tarea' });
    }
};

// ===============================
// 4. ACTUALIZAR TAREA (PUT) - MODIFICADO
// ===============================
exports.updateTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuarioAsignadoId, ...datosTarea } = req.body;

        const tarea = await Tarea.findByPk(id);
        if (!tarea) return res.status(404).json({ message: 'Tarea no encontrada.' });

        // 1. Actualizar datos básicos (nombre, descripción, dirección, etc.)
        await tarea.update(datosTarea);

        // 2. 🔥 ACTUALIZAR USUARIOS (Muchos a Muchos)
        if (usuarioAsignadoId) {
            const idsArray = Array.isArray(usuarioAsignadoId) 
                ? usuarioAsignadoId.filter(id => id !== "") 
                : [usuarioAsignadoId];
            
            await tarea.setUsuarios(idsArray);
            
            // Actualizamos también el campo viejo por compatibilidad
            await tarea.update({ usuarioAsignadoId: idsArray[0] || null });
        }

        const tareaActualizada = await Tarea.findByPk(id, { include: includeConfig });

        if (tareaActualizada.estado === 'Completada') {
            await Notificacion.destroy({ where: { tareaId: id } });
        }

        res.json({ message: 'Tarea actualizada con éxito.', tarea: tareaActualizada });
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({ message: 'Error al actualizar la tarea.' });
    }
};

// ===============================
// 5. ELIMINAR TAREA (DELETE)
// ===============================
exports.deleteTarea = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🚀 Iniciando limpieza total para Tarea ID: ${id}`);

    // 1️⃣ PRIMERO: Borramos la tabla intermedia de usuarios (Muchos a Muchos)
    // Sin esto, PostgreSQL no te deja borrar la tarea.
    await sequelize.query(`DELETE FROM "TareaUsuarios" WHERE "tareaId" = ${id}`);
    console.log(`👥 Usuarios asignados eliminados.`);

    // 2️⃣ SEGUNDO: Eliminar evidencias relacionadas
    await sequelize.query(`DELETE FROM "Evidencias" WHERE "tareaId" = ${id}`);
    console.log(`🖼️ Evidencias eliminadas.`);

    // 3️⃣ TERCERO: Eliminar notificaciones vinculadas
    await sequelize.query(`DELETE FROM "Notificacions" WHERE "tareaId" = ${id}`);
    console.log(`🧹 Notificaciones eliminadas.`);

    // 4️⃣ FINALMENTE: Ahora que no hay dependencias, borramos la tarea
    const deleted = await Tarea.destroy({ where: { id } });

    if (!deleted) {
        return res.status(404).json({ message: 'La tarea ya no existe en la base de datos.' });
    }

    res.json({ message: 'Tarea y todos sus registros asociados eliminados con éxito.' });

  } catch (error) {
    console.error('❌ Error crítico al eliminar tarea:', error);
    res.status(500).json({ 
        message: 'Error interno del servidor.', 
        error: error.message 
    });
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
        await sendPushToUser(tarea.AsignadoA.id, titulo, mensaje, { 
                click_action: "https://aetechprueba.netlify.app/sistema.html", // O la ruta específica de la tarea
            });

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


