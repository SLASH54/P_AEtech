const Usuario = require('./Usuario');
const Actividad = require('./Actividad');
const Sucursal = require('./Sucursal');
const ClienteNegocio = require('./ClienteNegocio');
const ClienteDireccion = require('./ClienteDireccion');
const Tarea = require('./Tarea');
const Evidencia = require('./Evidencia');
const Notificacion = require('./Notificacion');
const Cuenta = require('./cuenta');
const CuentaMaterial = require('./CuentaMaterial');


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

// Relación Tarea → ClienteDireccion
Tarea.belongsTo(ClienteDireccion, { 
  foreignKey: 'direccionClienteId', 
  as: 'DireccionEspecifica' 
});

ClienteDireccion.hasMany(Tarea, { 
  foreignKey: 'direccionClienteId' 
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


// 1. Un usuario crea muchas cuentas
Usuario.hasMany(Cuenta, { foreignKey: 'usuarioId' });
Cuenta.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// 2. Una cuenta tiene muchos materiales (Relación 1 a Muchos)
Cuenta.hasMany(CuentaMaterial, { foreignKey: 'cuentaId', as: 'materiales' });
CuentaMaterial.belongsTo(Cuenta, { foreignKey: 'cuentaId' });


module.exports = {
  Usuario,
  Actividad,
  Sucursal,
  ClienteNegocio,
  ClienteDireccion,
  Tarea,
  Evidencia,
  Notificacion,
  Cuenta,
  CuentaMaterial
};
