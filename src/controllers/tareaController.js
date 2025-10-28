// src/controllers/tareaController.js
const { Tarea, Usuario, Actividad, Sucursal, ClienteNegocio, Notificacion } = require('../models/relations');
const { sequelize } = require('../config/database');

// ===============================
// CONFIGURACIÓN DE INCLUSIÓN
// ===============================
const includeConfig = [
    { model: Usuario, as: 'AsignadoA', attributes: ['id', 'nombre', 'rol'] },
    { model: Actividad, attributes: ['id', 'nombre', 'campos_evidencia'] },
    { model: Sucursal, attributes: ['id', 'nombre', 'direccion'] },
    { model: ClienteNegocio, attributes: ['id', 'nombre'] }
];

// ===============================
// 1. CREAR TAREA (POST)
// ===============================
exports.createTarea = async (req, res) => {
    try {
        const { 
            nombre, usuarioAsignadoId, actividadId, 
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
            nombre, usuarioAsignadoId, actividadId, 
            sucursalId, clienteNegocioId, fechaLimite, prioridad 
        });

        // Obtener detalles de la tarea creada
        const tareaCreada = await Tarea.findByPk(tarea.id, { include: includeConfig });

        // ✅ Crear notificación automática para el usuario asignado
        await crearNotificacion(
            usuarioAsignadoId,
            `Se te ha asignado una nueva tarea: "${nombre}".`
        );

        return res.status(201).json({ message: 'Tarea asignada con éxito.', tarea: tareaCreada });
    } catch (error) {
        console.error('Error al crear tarea:', error);
        return res.status(500).json({ message: 'Error interno del servidor al crear la tarea.' });
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

        if (updated) {
            const tareaActualizada = await Tarea.findByPk(id, { include: includeConfig });
            return res.json({ message: 'Tarea actualizada con éxito.', tarea: tareaActualizada });
        }
        return res.status(404).json({ message: 'Tarea no encontrada.' });
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        return res.status(500).json({ message: 'Error interno del servidor al actualizar la tarea.' });
    }
};

// ===============================
// 5. ELIMINAR TAREA (DELETE)
// ===============================
exports.deleteTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Tarea.destroy({ where: { id } });

        if (deleted) {
            return res.json({ message: 'Tarea eliminada con éxito.' });
        }
        return res.status(404).json({ message: 'Tarea no encontrada.' });
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        return res.status(500).json({ message: 'Error interno del servidor al eliminar la tarea.' });
    }
};

// ===============================
// 6. FUNCIÓN INTERNA: CREAR NOTIFICACIÓN
// ===============================
async function crearNotificacion(usuarioId, mensaje) {
    try {
        await Notificacion.create({
            usuarioId,
            mensaje,
            leida: false
        });
        console.log(`📩 Notificación creada para usuario ${usuarioId}: ${mensaje}`);
    } catch (error) {
        console.error('❌ Error al crear notificación:', error);
    }
}
