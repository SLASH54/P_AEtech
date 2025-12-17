module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Levantamiento", {
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
    },

    // 🧩 NECESIDADES (texto + imagenes)
    necesidades: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    // 🧱 MATERIALES
    materiales: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  });
};
