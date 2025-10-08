// src/models/Evidencia.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Evidencia = sequelize.define('Evidencia', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // Clave Foránea a la Tarea que se está documentando
    tareaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Una Tarea solo puede tener una Evidencia final
        comment: 'FK a la Tarea completada que se está documentando.',
    },
    // Clave Foránea al Usuario que creó la evidencia
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'FK al usuario (Residente/Practicante) que creó el reporte.',
    },
    // CRÍTICO: Almacena los datos y URLs de las fotos/archivos.
    // La estructura JSON coincide con la metadata definida en el modelo Actividad.
    datos_recopilados: {
        type: DataTypes.JSONB, 
        allowNull: false,
        defaultValue: {},
        comment: 'Contenido dinámico de la evidencia (texto, IMEI, URLs de fotos).',
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Comentarios o notas finales del técnico.',
    },
    // Podrías añadir un campo para la geolocalización final, si es requerida
    // ubicacion_final: DataTypes.GEOMETRY('POINT', 4326), 
}, {
    tableName: 'Evidencias',
    timestamps: true, // createdAt (Fecha de finalización/reporte)
});

module.exports = Evidencia;