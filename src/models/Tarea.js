// src/models/Tarea.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const Tarea = sequelize.define('Tarea', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nombre de la tarea asignada (ej: Instalación GPS Suc. Centro)',
    },
    
    descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada de la tarea'
},

    // Claves Foráneas (FKs)
    usuarioAsignadoId: {
        type: DataTypes.INTEGER,
        allowNull: true ,
        comment: 'FK al usuario (Residente/Practicante) que debe realizar la tarea.',
    },
    actividadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'FK al tipo de actividad (Instalación GPS) que se debe realizar.',
    },
    sucursalId: {
        type: DataTypes.INTEGER,
        allowNull: true ,
        comment: 'FK a la sucursal donde se realizará la tarea.',
    },
    
   // En Tarea.js
clienteNegocioId: {
    type: DataTypes.INTEGER,
    allowNull: true, // <--- CAMBIA DE FALSE A TRUE
    comment: 'FK al cliente para el que se realiza la tarea.',
},
    
    // Campos de Control
    fechaLimite: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha máxima para completar la tarea.',
    },
    estado: {
        type: DataTypes.ENUM('Pendiente de Autorización', 'Pendiente', 'En Progreso', 'Completada', 'Cancelada', 'Bloqueada'),
        defaultValue: 'Pendiente',
        allowNull: false,
        comment: 'Estado actual de la tarea.',
    },
    prioridad: {
        type: DataTypes.ENUM('Baja', 'Normal', 'Alta'),
        defaultValue: 'Normal',
        allowNull: false,
    }
}, {
    tableName: 'Tareas',
    timestamps: true, // createdAt (fecha de asignación), updatedAt
});

module.exports = Tarea;