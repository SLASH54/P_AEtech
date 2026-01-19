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
        allowNull: true
    },
    fotoUrl: { // 👈 ESTO FALTA: Aquí se guarda el link de Cloudinary
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: false
});

module.exports = CuentaMaterial;