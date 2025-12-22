const {
  Usuario,
  Actividad,
  Sucursal,
  ClienteNegocio,
  ClienteDireccion,
  Tarea,
  Evidencia,
  Notificacion,
  Levantamiento
} = require("./index");

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
Tarea.belongsTo(Usuario, { foreignKey: "usuarioAsignadoId", as: "AsignadoA" });
Usuario.hasMany(Tarea, { foreignKey: "usuarioAsignadoId" });

// Evidencias
Tarea.hasMany(Evidencia, { foreignKey: "tareaId", onDelete: "CASCADE" });
Evidencia.belongsTo(Tarea, { foreignKey: "tareaId" });

// Notificaciones
Usuario.hasMany(Notificacion, { foreignKey: "usuarioId" });
Notificacion.belongsTo(Usuario, { foreignKey: "usuarioId" });
