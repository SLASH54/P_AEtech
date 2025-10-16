// src/config/database.js
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();



// ... (asegúrate de que esta lógica esté presente)
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const sequelize = new Sequelize(isProduction ? process.env.DATABASE_URL : {
  database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    // ... (configuración local)
}, isProduction ? {
    // ⬇ ESTA ES LA CONFIGURACIÓN CRÍTICA PARA RENDER ⬇
    dialectOptions: {
        ssl: {
            require: true, 
            rejectUnauthorized: false // Permite la conexión aunque no haya certificado raíz
        }
    }
} : {}); 



    // Configuración específica para producción (SSL) si usas una URL de Render/otro
    //dialectOptions: isProduction ? {
    //    ssl: {
    //       require: true, 
    //        rejectUnauthorized: false // Para evitar errores de certificado
    //    }
    //} : {}
//});

// ... (resto del código de sincronización)


async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos PostgreSQL exitosa.');
    
    // Sincroniza todos los modelos que has importado (crea las tablas si no existen)
        await sequelize.sync({ alter: true }); 
        console.log('⚙ Modelos sincronizados con la base de datos (Alter Mode).');

  } catch (error) {
    console.error('❌ Error al conectar o sincronizar la base de datos:', error.message);
    process.exit(1); 
  }
}

module.exports = { sequelize, connectDB };