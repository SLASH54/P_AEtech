const { Sequelize } = require('sequelize');
require('dotenv').config();

// Detectar entorno
const isProduction = process.env.NODE_ENV === 'production';

// === Configuración para producción (Render) ===
let sequelize;

if (isProduction) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // === Configuración para desarrollo local ===
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    }
  );
}

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado correctamente a PostgreSQL");

    // NO sincronizar en producción
    if (!isProduction) {
      await sequelize.sync({});
      console.log("⚙ Sincronización local completada");
    }

  } catch (error) {
    console.error("❌ Error al conectar:", error.message);
  }
}

module.exports = { sequelize, connectDB };
