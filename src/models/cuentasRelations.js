// src/models/cuentasRelations.js
const Cuenta = require('./Cuenta');
const CuentaMaterial = require('./CuentaMaterial');
const Usuario = require('./Usuario');

// Relación: Una cuenta tiene muchos materiales
Cuenta.hasMany(CuentaMaterial, { 
    foreignKey: 'cuentaId', 
    as: 'materiales', // Este es el alias que usaremos en los "includes"
    onDelete: 'CASCADE' // Si borras la cuenta, se borran sus materiales
});

CuentaMaterial.belongsTo(Cuenta, { 
    foreignKey: 'cuentaId' 
});

// Relación: Un usuario (técnico/admin) crea muchas cuentas
Usuario.hasMany(Cuenta, { 
    foreignKey: 'usuarioId', 
    as: 'cuentasCreadas' 
});

Cuenta.belongsTo(Usuario, { 
    foreignKey: 'usuarioId' 
});

module.exports = {
    Cuenta,
    CuentaMaterial,
    Usuario
};