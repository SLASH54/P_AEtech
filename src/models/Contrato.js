const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
  clienteNombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clienteRFC: {
    type: DataTypes.STRING,
    allowNull: true
  },
  firmaData: {
    type: DataTypes.TEXT, // Usamos TEXT para el Base64 largo
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 580.00
  }
}, {
  tableName: 'Contratos'
});

module.exports = Contrato;