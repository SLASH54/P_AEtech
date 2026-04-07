const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    clienteNombre: { type: DataTypes.STRING, allowNull: false },
    clienteRFC: { type: DataTypes.STRING, allowNull: false },
    clienteDomicilio: { type: DataTypes.TEXT },
    firmaData: { type: DataTypes.TEXT }, // Aquí guardamos la firma en formato Base64
    fechaGenerado: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'contratos',
    timestamps: true
});

module.exports = Contrato;