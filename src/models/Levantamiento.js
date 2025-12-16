module.exports = (sequelize, DataTypes) => {
  const Levantamiento = sequelize.define("Levantamiento", {
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    clienteNombre: {
      type: DataTypes.STRING
    },
    direccion: {
      type: DataTypes.TEXT
    },
    personal: {
      type: DataTypes.STRING
    },
    fecha: {
      type: DataTypes.DATE
    }
  });

  return Levantamiento;
};
