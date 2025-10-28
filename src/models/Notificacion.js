// src/models/Notificacion.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
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


