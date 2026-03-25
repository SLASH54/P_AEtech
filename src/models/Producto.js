const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Producto = sequelize.define('Producto', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    costo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    fotoUrl: { type: DataTypes.STRING, allowNull: true }, // URL de Cloudinary
    categoria: { type: DataTypes.STRING, defaultValue: 'General' }
});

module.exports = Producto;