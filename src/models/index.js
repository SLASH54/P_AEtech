const Sequelize = require("sequelize");
const sequelize = require("../database");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Levantamiento = require("./Levantamiento")(sequelize, Sequelize.DataTypes);

module.exports = db;
