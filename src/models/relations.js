// src/models/relations.js

const Usuario = require('./Usuario');
const Actividad = require('./Actividad'); 
const Sucursal = require('./Sucursal');
const ClienteNegocio = require('./ClienteNegocio');
const Tarea = require('./Tarea');
const Evidencia = require('./Evidencia');

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
// Una Tarea puede tener muchas Evidencias
Evidencia.belongsTo(Tarea, { foreignKey: 'tareaId' });
Tarea.hasMany(Evidencia, { foreignKey: 'tareaId', as: 'Evidencias' });
//Probablemente habra que cambiar esto a:
//Tarea.hasMany(Evidencia, {foreignKey: 'tareaId });  




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