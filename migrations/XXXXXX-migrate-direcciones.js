"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🛠️ Iniciando migración de direcciones antiguas...");

    // 1) Asegurar que la columna permita NULL
    await queryInterface.changeColumn("ClientesNegocio", "direccion", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 2) Obtener todos los clientes que tengan dirección antigua
    const [clientes] = await queryInterface.sequelize.query(`
      SELECT id, direccion 
      FROM "ClientesNegocio"
      WHERE direccion IS NOT NULL AND direccion != ''
    `);

    console.log(`📦 Clientes encontrados con direccion antigua: ${clientes.length}`);

    // 3) Insertar direcciones en la nueva tabla
    for (const c of clientes) {
      await queryInterface.bulkInsert("ClientesDirecciones", [
        {
          clienteId: c.id,
          estado: "Desconocido",
          municipio: "Desconocido",
          direccion: c.direccion,
          maps: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    console.log("✅ Migración completada: direcciones movidas correctamente.");
  },

  async down(queryInterface, Sequelize) {
    console.log("⏳ Revirtiendo migración...");

    // Eliminar direcciones creadas por esta migración
    await queryInterface.bulkDelete("ClientesDirecciones", {
      estado: "Desconocido",
      municipio: "Desconocido",
    });

    // Restaurar NOT NULL (si lo deseas)
    await queryInterface.changeColumn("ClientesNegocio", "direccion", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    console.log("⏪ Migración revertida.");
  },
};
