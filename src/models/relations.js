// src/models/relations.js

const Usuario = require('./Usuario');
const Actividad = require('./Actividad'); 
const Sucursal = require('./Sucursal');
const ClienteNegocio = require('./ClienteNegocio');
const Tarea = require('./Tarea');
const Evidencia = require('./Evidencia');
const ClienteDireccion = require('./ClienteDireccion');

// Un cliente tiene muchas direcciones
ClienteNegocio.hasMany(ClienteDireccion, {
  foreignKey: "clienteId",
  as: "direcciones",
  onDelete: "CASCADE"
});

ClienteDireccion.belongsTo(ClienteNegocio, {
  foreignKey: "clienteId"
});




// 1. Relación Tarea -> Usuario (Asignación)
// Una Tarea es asignada a un Usuario
Tarea.belongsTo(Usuario, { foreignKey: 'usuarioAsignadoId', as: 'AsignadoA' });
Usuario.hasMany(Tarea, { foreignKey: 'usuarioAsignadoId', as: 'TareasAsignadas' });

// 2. Relación Tarea -> Actividad (Catálogo)
// Una Tarea es de un tipo de Actividad
Tarea.belongsTo(Actividad, { foreignKey: 'actividadId' });
Actividad.hasMany(Tarea, { foreignKey: 'actividadId' });

// 3. Relación Tarea -> Sucursal (Ubicación)
// Una Tarea se realiza en una Sucursal
Tarea.belongsTo(Sucursal, { foreignKey: 'sucursalId' });
Sucursal.hasMany(Tarea, { foreignKey: 'sucursalId' });

// 4. Relación Tarea -> ClienteNegocio (Facturación/Reporte)
// Una Tarea se realiza para un Cliente
Tarea.belongsTo(ClienteNegocio, { foreignKey: 'clienteNegocioId' });
ClienteNegocio.hasMany(Tarea, { foreignKey: 'clienteNegocioId' });


// 5. Relación Evidencia -> Tarea
// Una Evidencia documenta una Tarea
Evidencia.belongsTo(Tarea, { foreignKey: 'tareaId' });
//Tarea.hasOne(Evidencia, { foreignKey: 'tareaId' }); // Una Tarea tiene una única Evidencia
//Probablemente habra que cambiar esto a:
Tarea.hasMany(Evidencia, { 
  foreignKey: 'tareaId',
  onDelete: 'CASCADE',   // 🔹 elimina evidencias automáticamente
  hooks: true            // 🔹 asegura que Sequelize ejecute el borrado en cascada
});

Evidencia.belongsTo(Tarea, { foreignKey: 'tareaId' });




// 6. Relación Evidencia -> Usuario (Autor del Reporte)
// Una Evidencia fue creada por un Usuario
Evidencia.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Autor' });
Usuario.hasMany(Evidencia, { foreignKey: 'usuarioId', as: 'EvidenciasCreadas' });

module.exports = {
    Usuario,
    Actividad,
    Sucursal,
    ClienteNegocio,
    Tarea,
    Evidencia // ¡Asegúrate de exportarlo!
};









// Notificaciones 

const Notificacion = require('./Notificacion');

//Relacion Usuario-Notificacion
Usuario.hasMany(Notificacion, { foreignKey: 'usuarioId', as: 'Notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });




//Relacion Tarea-Notificacion
Tarea.hasMany(Notificacion, { foreignKey: 'tareaId', onDelete: 'CASCADE' });
Notificacion.belongsTo(Tarea, { foreignKey: 'tareaId' });


module.exports = {
  Usuario,
  Notificacion,
  Actividad,
  Sucursal,
  ClienteNegocio,
  Tarea,
  Evidencia
};
