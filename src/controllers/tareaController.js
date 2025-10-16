// src/controllers/tareaController.js
const { Tarea, Usuario, Actividad, Sucursal, ClienteNegocio } = require('../models/relations');
const { sequelize } = require('../config/database');

// Configuración de inclusión para GET (detalles completos de la tarea)
const includeConfig = [
    { model: Usuario, as: 'AsignadoA', attributes: ['id', 'nombre', 'rol'] },
    { model: Actividad, attributes: ['id', 'nombre', 'campos_evidencia'] },
    { model: Sucursal, attributes: ['id', 'nombre', 'direccion'] },
    { model: ClienteNegocio, attributes: ['id', 'nombre'] }
];

// 1. Crear Tarea (POST) - Solo Admin/Ingeniero
exports.createTarea = async (req, res) => {
    try {
        const { 
            nombre, usuarioAsignadoId, actividadId, 
            sucursalId, clienteNegocioId, fechaLimite, prioridad 
        } = req.body;
        
        // Verificación básica de IDs necesarios
        if (!nombre || !usuarioAsignadoId || !actividadId || !sucursalId || !clienteNegocioId) {
            return res.status(400).json({ 
                message: 'Faltan campos requeridos (nombre, asignado, actividad, sucursal o cliente).' 
            });
        }

        const tarea = await Tarea.create({
            nombre, usuarioAsignadoId, actividadId, 
            sucursalId, clienteNegocioId, fechaLimite, prioridad 
        });

        // Devolver la tarea con los detalles de las relaciones
        const tareaCreada = await Tarea.findByPk(tarea.id, { include: includeConfig });

        return res.status(201).json({ message: 'Tarea asignada con éxito.', tarea: tareaCreada });
    } catch (error) {
        console.error('Error al crear tarea:', error);
        return res.status(500).json({ message: 'Error interno del servidor al crear la tarea.' });
    }
};

// 2. Obtener TODAS las Tareas (GET) - Admin/Ingeniero
// Aquí el Admin/Ingeniero ve TODAS las tareas para monitoreo.
exports.getAllTareas = async (req, res) => {
    try {
        const tareas = await Tarea.findAll({ 
            include: includeConfig,
            order: [['createdAt', 'DESC']]
        });
        return res.json(tareas);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener las tareas.' });
    }
};

// 3. Obtener Tareas ASIGNADAS (GET) - Residente/Practicante
// Aquí el Residente/Practicante solo ve las tareas que le fueron asignadas.
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

// 4. Actualizar Tarea (PUT) - Admin/Ingeniero (para reasignar o cambiar estado/prioridad)
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

// 5. Eliminar Tarea (DELETE) - Solo Admin
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
        return res.status(500).json({ message: 'Error interno del servidor al eliminar la tarea.' });
    }
};