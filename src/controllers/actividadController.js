// src/controllers/actividadController.js
const Actividad = require('../models/Actividad');

// 1. Crear Actividad (POST)
exports.createActividad = async (req, res) => {
    try {
        const { nombre, descripcion, campos_evidencia } = req.body;
        
        if (!nombre || !campos_evidencia) {
            return res.status(400).json({ 
                message: 'El nombre y la estructura de evidencia son requeridos.' 
            });
        }

        const actividad = await Actividad.create({ nombre, descripcion, campos_evidencia });
        return res.status(201).json({ message: 'Actividad registrada con éxito.', actividad });
    } catch (error) {
        console.error('Error al crear actividad:', error);
        return res.status(500).json({ message: 'Error interno del servidor al crear la actividad.' });
    }
};

// 2. Obtener Todas las Actividades (GET)
exports.getAllActividades = async (req, res) => {
    try {
        // Se incluyen los campos_evidencia para que el frontend pueda construir los formularios dinámicamente
        const actividades = await Actividad.findAll({
            attributes: ['id', 'nombre', 'descripcion', 'campos_evidencia', 'activo']
        });
        return res.json(actividades);
    } catch (error) {
        console.error('Error al obtener actividades:', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener las actividades.' });
    }
};

// ... (Agregar exports.updateActividad y exports.deleteActividad con lógica similar)

// 3. Actualizar Actividad (PUT) - Solo Admin/Ingeniero
exports.updateActividad = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, activo, campos_evidencia } = req.body;

        const [updated] = await Actividad.update(
            { nombre, descripcion, activo, campos_evidencia },
            { where: { id } }
        );

        if (updated) {
            const actividad = await Actividad.findOne({ where: { id } });
            return res.json({ message: 'Actividad actualizada con éxito.', actividad });
        }
        return res.status(404).json({ message: 'Actividad no encontrada.' });
    } catch (error) {
        console.error('Error al actualizar actividad:', error);
        return res.status(500).json({ message: 'Error interno del servidor al actualizar la actividad.' });
    }
};

// 4. Eliminar Actividad (DELETE) - Solo Admin/Ingeniero
exports.deleteActividad = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Actividad.destroy({
            where: { id }
        });

        if (deleted) {
            return res.json({ message: 'Actividad eliminada con éxito.' });
        }
        return res.status(404).json({ message: 'Actividad no encontrada.' });
    } catch (error) {
        console.error('Error al eliminar actividad:', error);
        return res.status(500).json({ message: 'Error interno del servidor al eliminar la actividad.' });
    }
};