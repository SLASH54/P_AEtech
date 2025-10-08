// src/models/Sucursal.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sucursal = sequelize.define('Sucursal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // CRÍTICO: Campo geográfico usando PostGIS
    ubicacion: {
        // Usa GEOMETRY, que es el tipo estándar de PostGIS para puntos
        type: DataTypes.GEOMETRY('POINT', 4326), // 4326 es el sistema de referencia WGS 84 (GPS estándar)
        allowNull: false,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Para desactivar sucursales sin borrarlas
    }
}, {
    // Nombre de la tabla en plural
    tableName: 'Sucursales', 
});

module.exports = Sucursal;