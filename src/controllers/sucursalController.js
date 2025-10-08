// src/controllers/sucursalController.js
const Sucursal = require('../models/Sucursal');
const { sequelize } = require('../config/database'); // Necesario para consultas crudas con PostGIS
const { Op } = require('sequelize');

// Función de ayuda para extraer la ubicación del cuerpo de la petición
const getPointFromRequest = (lat, lng) => {
    // CORRECCIÓN CRÍTICA: Usar sequelize.literal() para que Sequelize sepa que es una función SQL
    return sequelize.literal(`ST_GeomFromText('POINT(${lng} ${lat})', 4326)`);
};


// 1. CREAR SUCURSAL
exports.createSucursal = async (req, res) => {
    try {
        const { nombre, direccion, latitud, longitud } = req.body;
        
        // 1. Validar coordenadas (opcional, pero buena práctica)
        if (!latitud || !longitud) {
             return res.status(400).json({ message: 'Latitud y longitud son requeridas.' });
        }

        // 2. Usar la función de ayuda corregida
        const ubicacionPoint = getPointFromRequest(latitud, longitud);

        const sucursal = await Sucursal.create({
            nombre,
            direccion,
            ubicacion: ubicacionPoint // <-- Esto inserta el literal SQL
        });

        return res.status(201).json({ message: 'Sucursal registrada con éxito.', sucursal });
    } catch (error) {
        // El error 500 ahora debería ser menos ambiguo si hay otro problema
        console.error("Error al registrar sucursal:", error);
        return res.status(500).json({ message: 'Error interno del servidor al crear sucursal.' });
    }
};


// 2. OBTENER TODAS las Sucursales (Roles: Todos menos Practicante)
exports.getAllSucursales = async (req, res) => {
    try {
        // En consultas GET, podemos usar funciones PostGIS para devolver la ubicación en formato Lat/Lng simple
        const sucursales = await Sucursal.findAll({
            attributes: [
                'id',
                'nombre',
                'direccion',
                'estado',
                // Extraer Latitud y Longitud del campo GEOMETRY
                [sequelize.fn('ST_Y', sequelize.col('ubicacion')), 'latitud'],
                [sequelize.fn('ST_X', sequelize.col('ubicacion')), 'longitud'],
            ]
        });
        return res.json(sucursales);
    } catch (error) {
        console.error("Error al obtener sucursales:", error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener sucursales.' });
    }
};

// 3. ACTUALIZAR Sucursal (Roles: Admin, Ingeniero)
exports.updateSucursal = async (req, res) => {
    try {
        const sucursalId = req.params.id;
        const { nombre, direccion, latitud, longitud, estado } = req.body;
        
        const updateFields = {};
        if (nombre) updateFields.nombre = nombre;
        if (direccion) updateFields.direccion = direccion;
        if (estado !== undefined) updateFields.estado = estado; // Permite actualizar a true/false

        if (latitud && longitud) {
            updateFields.ubicacion = getPointFromRequest(latitud, longitud);
        }

        const [updated] = await Sucursal.update(updateFields, {
            where: { id: sucursalId }
        });

        if (updated) {
            return res.json({ message: 'Sucursal actualizada con éxito.' });
        }
        return res.status(404).json({ message: 'Sucursal no encontrada.' });
    } catch (error) {
        console.error("Error al actualizar sucursal:", error);
        return res.status(500).json({ message: 'Error interno del servidor al actualizar sucursal.' });
    }
};

// 4. ELIMINAR Sucursal (Roles: Admin)
exports.deleteSucursal = async (req, res) => {
    try {
        const deleted = await Sucursal.destroy({
            where: { id: req.params.id }
        });

        if (deleted) {
            return res.json({ message: 'Sucursal eliminada con éxito.' });
        }
        return res.status(404).json({ message: 'Sucursal no encontrada.' });
    } catch (error) {
        console.error("Error al eliminar sucursal:", error);
        return res.status(500).json({ message: 'Error interno del servidor al eliminar sucursal.' });
    }
};