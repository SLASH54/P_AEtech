module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Levantamiento", {
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    clienteNombre: DataTypes.STRING,
    direccion: DataTypes.TEXT,
    personal: DataTypes.STRING,
    fecha: DataTypes.DATE,

    // 🔥 AQUÍ SE GUARDAN LAS NECESIDADES
    necesidades: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    // 🔥 AQUÍ SE GUARDAN LOS MATERIALES
    materiales: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  });
};
