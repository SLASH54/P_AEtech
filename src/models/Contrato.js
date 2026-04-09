const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
  // 🛡️ Nombres exactos de tu tabla en Neon
  cliente_nombre: { type: DataTypes.STRING, allowNull: false }, 
  cliente_rfc: { type: DataTypes.STRING, allowNull: true },    
  firma_base64: { type: DataTypes.TEXT, allowNull: true },     
  // monto no aparece en tu imagen, si no lo tienes en la DB, quítalo de aquí
}, {
  tableName: 'contratos', 
  timestamps: false // 👈 ¡ESTO ES LO MÁS IMPORTANTE! Evita el error de createdAt
});

module.exports = Contrato;