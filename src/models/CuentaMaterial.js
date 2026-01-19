const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CuentaMaterial = sequelize.define('CuentaMaterial', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    costo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    unidad: {
        type: DataTypes.STRING,
        allowNull: true // Ej: "Pza", "Metro", "Servicio"
    }
}, {
    timestamps: false // No necesitamos fecha de creación por cada tornillo
});

module.exports = CuentaMaterial;