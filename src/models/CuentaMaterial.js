const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CuentaMaterial = sequelize.define('CuentaMaterial', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, defaultValue: 1 },
    costo: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fotoUrl: { type: DataTypes.TEXT, allowNull: true },
    // 🔑 ESTA ES LA QUE FALTA:
    cuentaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'CuentaMaterials',
    timestamps: false
});

module.exports = CuentaMaterial;