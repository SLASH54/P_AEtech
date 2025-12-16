// src/models/relations.js

const { sequelize } = require('../database');
const { DataTypes } = require('sequelize');

// Inicializar modelos correctamente
const Usuario = require('./Usuario')(sequelize, DataTypes);
const Actividad = require('./Actividad')(sequelize, DataTypes);
const Sucursal = require('./Sucursal')(sequelize, DataTypes);
const ClienteNegocio = require('./ClienteNegocio')(sequelize, DataTypes);
const Tarea = require('./Tarea')(sequelize, DataTypes);
const Evidencia = require('./Evidencia')(sequelize, DataTypes);
const ClienteDireccion = require('./ClienteDireccion')(sequelize, DataTypes);
const Notificacion = require('./Notificacion')(sequelize, DataTypes);
const Levantamiento = require('./Levantamiento')(sequelize, DataTypes);

// ================= RELACIONES =================

// Cliente → Direcciones
ClienteNegocio.hasMany(ClienteDireccion, {
  foreignKey: "clienteId",
  as: "direcciones",
  onDelete: "CASCADE"
});

ClienteDireccion.belongsTo(ClienteNegocio, {
  foreignKey: "clienteId",
  as: "cliente"
});

// Tarea → Usuario
Tarea.belongsTo(Usuario, { foreignKey: 'usuarioAsignadoId', as: 'AsignadoA' });
Usuario.hasMany(Tarea, { foreignKey: 'usuarioAsignadoId', as: 'TareasAsignadas' });

// Tarea → Actividad
Tarea.belongsTo(Actividad, { foreignKey: 'actividadId' });
Actividad.hasMany(Tarea, { foreignKey: 'actividadId' });

// Tarea → Sucursal
Tarea.belongsTo(Sucursal, { foreignKey: 'sucursalId' });
Sucursal.hasMany(Tarea, { foreignKey: 'sucursalId' });

// Tarea → Cliente
Tarea.belongsTo(ClienteNegocio, { foreignKey: 'clienteNegocioId' });
ClienteNegocio.hasMany(Tarea, { foreignKey: 'clienteNegocioId' });

// Evidencia → Tarea
Tarea.hasMany(Evidencia, { 
  foreignKey: 'tareaId',
  onDelete: 'CASCADE',
  hooks: true
});
Evidencia.belongsTo(Tarea, { foreignKey: 'tareaId' });

// Evidencia → Usuario
Evidencia.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Autor' });
Usuario.hasMany(Evidencia, { foreignKey: 'usuarioId', as: 'EvidenciasCreadas' });

// Notificaciones
Usuario.hasMany(Notificacion, { foreignKey: 'usuarioId', as: 'Notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });

Tarea.hasMany(Notificacion, { foreignKey: 'tareaId', onDelete: 'CASCADE' });
Notificacion.belongsTo(Tarea, { foreignKey: 'tareaId' });

module.exports = {
  Usuario,
  Actividad,
  Sucursal,
  ClienteNegocio,
  ClienteDireccion,
  Tarea,
  Evidencia,
  Notificacion,
  Levantamiento
};
