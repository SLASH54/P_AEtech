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


async function cargarNotificaciones() {
  const res = await fetch('/api/notificaciones');
  const notificaciones = await res.json();

  const pendientes = notificaciones.filter(n => n.estado === 'pendiente');
  actualizarCampana(pendientes);
}

setInterval(cargarNotificaciones, 30000); // cada 30 segundos
