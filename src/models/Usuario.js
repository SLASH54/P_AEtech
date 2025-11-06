// src/models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // El email debe ser único
    },
    password: {
        type: DataTypes.STRING, // Almacenará el hash de la contraseña
        allowNull: false,
    },
    rol: {
        type: DataTypes.ENUM('Admin' , 'Residente' , 'Ingeniero' , 'Practicante'), // Define los roles posibles
        defaultValue: 'Practicante',
        allowNull: false,
    },
    fcmToken: {
        type: DataTypes.STRING,
        allowNull: true,
    }


    // Aquí puedes añadir foto_perfil_url, sucursalId, etc.
});

module.exports = Usuario;