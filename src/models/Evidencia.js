// =============================
// src/models/Evidencia.js
// =============================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const Evidencia = sequelize.define('Evidencia', {
  
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tareaId: { type: DataTypes.INTEGER, allowNull: false },
  usuarioId: { type: DataTypes.INTEGER, allowNull: false },
  titulo: { type: DataTypes.STRING, allowNull: false },
  archivoUrl: { type: DataTypes.STRING, allowNull: false },
  firmaClienteUrl: { type: DataTypes.STRING, allowNull: true },


  materiales: {
  type: DataTypes.JSON, // o DataTypes.TEXT si tu DB no soporta JSON
  allowNull: true
},


}, {
  tableName: 'Evidencias',
  timestamps: true,
});




module.exports = Evidencia;


