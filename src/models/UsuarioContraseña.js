const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');const bcrypt = require('bcrypt'); // Para encriptar contraseñas

const Usuario = db.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Importante para que no se repitan correos
        validate: {
            isEmail: true // Valida que sea un correo real
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    hooks: {
        // Antes de guardar un usuario (o actualizar contraseña), la encriptamos
        beforeCreate: async (usuario) => {
            const salt = await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(usuario.password, salt);
        }
    },
    timestamps: true // Para tener createdAt y updatedAt
});

// Método para verificar la contraseña después
Usuario.prototype.validarPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = Usuario;