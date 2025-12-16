module.exports = (sequelize, DataTypes) => {
  const Levantamiento = sequelize.define("Levantamiento", {
    clienteNegocioId: DataTypes.INTEGER,
    direccion: DataTypes.STRING,
    fecha: DataTypes.DATE,
    personalNombre: DataTypes.STRING,
    materiales: DataTypes.JSON,
    necesidades: DataTypes.JSON
  });

  return Levantamiento;
};
