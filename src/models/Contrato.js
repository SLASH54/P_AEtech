const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
  cliente_nombre: { type: DataTypes.STRING, allowNull: false }, 
  cliente_rfc: { type: DataTypes.STRING, allowNull: true },    
  firma_base64: { type: DataTypes.TEXT, allowNull: true },      // Firma Cliente
  firma_prestadora_base64: { type: DataTypes.TEXT, allowNull: true } // 👈 AGREGA ESTA LÍNEA
}, {
  tableName: 'contratos', 
  timestamps: false 
});

module.exports = Contrato;