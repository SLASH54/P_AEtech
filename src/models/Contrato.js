const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
  cliente_nombre: { type: DataTypes.STRING, allowNull: false }, 
  cliente_rfc:    { type: DataTypes.STRING, allowNull: true },    
  // --- NUEVOS CAMPOS ---
  domicilio:      { type: DataTypes.TEXT,   allowNull: true }, // Se mapea a pdf-domicilio-servicio
  meses_contrato: { type: DataTypes.STRING, allowNull: true }, // Se mapea a pdf-meses-contrato
  fecha_inicio:   { type: DataTypes.STRING, allowNull: true }, // Se mapea a pdf-fecha-inicio
  fecha_fin:      { type: DataTypes.STRING, allowNull: true }, // Se mapea a pdf-fecha-fin
  // ---------------------
  firma_cliente:  { type: DataTypes.TEXT,   allowNull: true }, 
  firma_dueno:    { type: DataTypes.TEXT,   allowNull: true }  
}, {
  tableName: 'contratos', 
  timestamps: false 
});

module.exports = Contrato;