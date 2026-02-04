const { Sequelize, DataTypes } = require("sequelize");

const { sequelize } = require('../config/database');

// Importar los modelos
const LevantamientoModel = require("./Levantamiento");
const ClienteNegocio = require("./ClienteNegocio");
const ClienteDireccion = require("./ClienteDireccion");

// Inicializar Levantamiento (porque es una función)
const Levantamiento = LevantamientoModel(sequelize, DataTypes);

// Definir Relaciones (Opcional pero recomendado)
ClienteNegocio.hasMany(ClienteDireccion, { foreignKey: 'clienteId' });
ClienteDireccion.belongsTo(ClienteNegocio, { foreignKey: 'clienteId' });

// Exportar TODOS los modelos
module.exports = {
  sequelize,
  Sequelize,
  Levantamiento,
  ClienteNegocio,
  ClienteDireccion
};


