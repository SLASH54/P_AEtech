const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
  // 🛡️ Nombres exactos de tu tabla en Neon
  cliente_nombre: { type: DataTypes.STRING, allowNull: false }, 
  cliente_rfc: { type: DataTypes.STRING, allowNull: true },    

 firmaCliente: {
        type: DataTypes.TEXT,
        allowNull: true // O false si es obligatorio
    },
    firmaDueno: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'contratos', // Asegúrate de que coincida con tu tabla en la DB
    timestamps: true        // Para tener createdAt y updatedAt
});

module.exports = Contrato;
