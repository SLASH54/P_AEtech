const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
  // Asegúrate de que estos nombres existan exactamente así en tu tabla de Neon
  cliente_nombre: { type: DataTypes.STRING, allowNull: false }, 
  cliente_rfc:    { type: DataTypes.STRING, allowNull: true },    
  firma_cliente:  { type: DataTypes.TEXT,   allowNull: true }, // Antes tenías contratoFirmaBase64
  firma_dueno:    { type: DataTypes.TEXT,   allowNull: true }  // La firma de Denisse
}, {
  tableName: 'contratos', 
  timestamps: false 
});

module.exports = Contrato;