module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Levantamiento",
    {
      cliente_id: {
        type: DataTypes.INTEGER,
        field: "cliente_id"
      },
      cliente_nombre: {
        type: DataTypes.STRING,
        field: "cliente_nombre"
      },
      direccion: {
        type: DataTypes.TEXT
      },
      personal: {
        type: DataTypes.STRING,
        field: "personal"
      },
      fecha: {
        type: DataTypes.DATE
      },
      created_at: {
        type: DataTypes.DATE,
        field: "created_at"
      },
      necesidades: {
        type: DataTypes.JSON
      },
      materiales: {
        type: DataTypes.JSON
}

    },
    {
      tableName: "levantamientos", // 👈 NOMBRE REAL
      timestamps: false            // 👈 NO createdAt / updatedAt
    }
  );
};
