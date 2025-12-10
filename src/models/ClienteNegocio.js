// src/models/ClienteNegocio.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClienteNegocio = sequelize.define('ClienteNegocio', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
   
    email: {
        type: DataTypes.STRING,
        allowNull: true, // Puede que no todos tengan correo
        unique: false,
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Este campo puede usarse para enlazar al usuario de la plataforma (rol 'Cliente') 
    // que interactúa en nombre de esta entidad, si aplica.
    // usuarioId: {
    //     type: DataTypes.INTEGER,
    //     references: { model: 'Usuarios', key: 'id' } 
    // }
}, {
    tableName: 'ClientesNegocio', 
});

module.exports = ClienteNegocio;