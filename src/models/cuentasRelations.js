const Cuenta = require('./Cuenta');
const CuentaMaterial = require('./CuentaMaterial');
const Usuario = require('./Usuario');

// Relación: Una cuenta tiene muchos materiales
Cuenta.hasMany(CuentaMaterial, { 
    foreignKey: 'cuentaId', 
    as: 'materiales', 
    onDelete: 'CASCADE' 
});

CuentaMaterial.belongsTo(Cuenta, { 
    foreignKey: 'cuentaId',
    as: 'cuenta'
});

// Relación con Usuario (Asegúrate que coincida con el controlador)
Usuario.hasMany(Cuenta, { 
    foreignKey: 'usuarioId', 
    as: 'cuentas' 
});

Cuenta.belongsTo(Usuario, { 
    foreignKey: 'usuarioId',
    as: 'usuario'
});

module.exports = { Cuenta, CuentaMaterial, Usuario };