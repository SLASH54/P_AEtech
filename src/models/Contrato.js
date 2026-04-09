const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
  // 🚨 Usamos los nombres exactos de tu tabla de Supabase
  cliente_nombre: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  cliente_rfc: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  firma_base64: { 
    type: DataTypes.TEXT, // Usamos TEXT porque el Base64 es una cadena muy larga
    allowNull: true 
  },
  monto: { 
    type: DataTypes.DECIMAL(10, 2), 
    defaultValue: 580.00 
  }
}, {
  tableName: 'contratos', // Asegúrate que sea minúscula si así está en tu DB
  timestamps: true
});

module.exports = Contrato;