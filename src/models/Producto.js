const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Producto = sequelize.define('Producto', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  costo: { 
    type: DataTypes.DECIMAL(10, 2), 
    defaultValue: 0.00 
  },
  fotoUrl: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  categoria: { 
    type: DataTypes.STRING, 
    defaultValue: 'General' 
  }
}, {
  tableName: 'Productos',
  timestamps: true,
});

module.exports = Producto;