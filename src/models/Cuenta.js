const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cuenta = sequelize.define('Cuenta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    numeroNota: { // 👈 NUEVA COLUMNA
        type: DataTypes.STRING,
        allowNull: true
    },
    clienteNombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    anticipo: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    saldo: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    iva: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ivaPorcentaje: {
        type: DataTypes.INTEGER,
        defaultValue: 16
    },
    factura: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    folioFactura: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    estatus: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Cancelado'),
        defaultValue: 'Pendiente'
    }
}, {
    timestamps: true
});

module.exports = Cuenta;