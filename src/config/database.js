const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

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
    // 🔥 CONFIGURACIÓN DEL POOL PARA PRODUCCIÓN
    pool: {
      max: 10,        // Permite hasta 10 conexiones simultáneas
      min: 0,         // Cierra conexiones si nadie las usa
      acquire: 30000, // Tiempo máximo (ms) para intentar conectar antes de dar error
      idle: 10000     // Tiempo (ms) para que una conexión se cierre si está inactiva
    },
    native: false,
    logging: false
  });
} else {
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
      // 🔥 TAMBIÉN EN DESARROLLO PARA EVITAR BLOQUEOS
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: false
    }
  );
}

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado correctamente a PostgreSQL (Neon)");
    
    // Ojo: En tu server.js vi que haces sync() global. 
    // Si ya lo tienes allá, aquí podrías quitarlo para no duplicar carga.
  } catch (error) {
    console.error("❌ Error al conectar:", error.message);
  }
}

// ... (al final de database.js)
module.exports = { sequelize, connectDB };