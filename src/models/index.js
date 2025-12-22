const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Usuario = require("./Usuario")(sequelize, DataTypes);
const Actividad = require("./Actividad")(sequelize, DataTypes);
const Sucursal = require("./Sucursal")(sequelize, DataTypes);
const ClienteNegocio = require("./ClienteNegocio")(sequelize, DataTypes);
const ClienteDireccion = require("./ClienteDireccion")(sequelize, DataTypes);
const Tarea = require("./Tarea")(sequelize, DataTypes);
const Evidencia = require("./Evidencia")(sequelize, DataTypes);
const Notificacion = require("./Notificacion")(sequelize, DataTypes);
const Levantamiento = require("./Levantamiento")(sequelize, DataTypes);

module.exports = {
  sequelize,
  Sequelize,
  Usuario,
  Actividad,
  Sucursal,
  ClienteNegocio,
  ClienteDireccion,
  Tarea,
  Evidencia,
  Notificacion,
  Levantamiento
};
