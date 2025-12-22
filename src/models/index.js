const { Sequelize, DataTypes } = require("sequelize");

const { sequelize } = require('../config/database');


const LevantamientoModel = require("./Levantamiento");

const Levantamiento = LevantamientoModel(sequelize, DataTypes);



module.exports = {
  sequelize,
  Sequelize,
  Levantamiento
};


