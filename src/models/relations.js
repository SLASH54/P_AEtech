const Usuario = require('./Usuario');
const Actividad = require('./Actividad');
const Sucursal = require('./Sucursal');
const ClienteNegocio = require('./ClienteNegocio');
const ClienteDireccion = require('./ClienteDireccion');
const Tarea = require('./Tarea');
const Evidencia = require('./Evidencia');
const Notificacion = require('./Notificacion');
const Levantamiento = require('./Levantamiento')(sequelize, DataTypes);

/* ================= RELACIONES ================= */

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

// Evidencias
Tarea.hasMany(Evidencia, { foreignKey: 'tareaId', onDelete: 'CASCADE' });
Evidencia.belongsTo(Tarea, { foreignKey: 'tareaId' });

// Notificaciones
Usuario.hasMany(Notificacion, { foreignKey: 'usuarioId' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuarioId' });

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
  Notificacion
};
