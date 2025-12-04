// src/models/Notificacion.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  tareaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Tareas',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  mensaje: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Notificacion;
