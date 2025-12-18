const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ClienteDireccion = sequelize.define("ClienteDireccion", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  clienteId: { 
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  estado: { type: DataTypes.STRING, allowNull: false },
  municipio: { type: DataTypes.STRING, allowNull: false },
  direccion: { type: DataTypes.STRING, allowNull: false },

  maps: { type: DataTypes.STRING, allowNull: true }, // link opcional
  alias: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: "ClientesDirecciones"
});

module.exports = ClienteDireccion;
