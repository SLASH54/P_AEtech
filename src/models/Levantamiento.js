module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Levantamiento", {
    clienteId: DataTypes.INTEGER,
    clienteNombre: DataTypes.STRING,
    direccion: DataTypes.TEXT,
    personal: DataTypes.STRING,
    fecha: DataTypes.DATE,

    necesidades: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    materiales: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: "levantamientos", // 🔥 CLAVE
    timestamps: true
  });
};
