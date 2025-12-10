// src/models/Actividad.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Actividad = sequelize.define('Actividad', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        //unique: true,
        comment: 'Nombre de la actividad (ej: Instalación de GPS)',
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // CRÍTICO: Almacena la estructura del formulario de Evidencia.
    // Ej: [{ nombre: "Foto antes...", tipo: "foto", requerido: true }, ...]
    campos_evidencia: {
        type: DataTypes.JSONB, 
        allowNull: false,
        defaultValue: [],
        comment: 'Estructura JSON que define los campos/fotos requeridos.',
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
}, {
    tableName: 'Actividades',
    timestamps: true,
});

module.exports = Actividad;