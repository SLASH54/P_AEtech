const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log("Intentando conectar a:", process.env.DB_HOST);
console.log("Con usuario:", process.env.DB_USER);
console.log("Base de datos:", process.env.DB_NAME);

const sequelize = new Sequelize(
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

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos PostgreSQL exitosa.');
  } catch (error) {
    console.error('❌ Error al conectar o sincronizar la base de datos:', error.message);
  }
}

//module.exports = { sequelize, connectDB };




    // Configuración específica para producción (SSL) si usas una URL de Render/otro
    //dialectOptions: isProduction ? {
    //    ssl: {
    //       require: true, 
    //        rejectUnauthorized: false // Para evitar errores de certificado
    //    }
    //} : {}
//});

// ... (resto del código de sincronización)



//async function connectDB() {
 //       console.log('Intentando conectar a:', process.env.DB_HOST);
//        console.log('Con usuario:', process.env.DB_USER);
//        console.log('Base de datos:', process.env.DB_NAME);
//    try {
//        await sequelize.authenticate();
//        console.log('✅ Conexión a la base de datos PostgreSQL exitosa.');
//        
        // 🛑 CLAVE: COMENTA O ELIMINA LA LÍNEA DE SINCRONIZACIÓN.
        // Esto permite que el servidor arranque si las tablas ya existen.
        // await sequelize.sync({}); 
//        console.log('⚙ Modelos listos. NO se intentó la sincronización automática.');

//    } catch (error) {
//        console.error('❌ Error al conectar o sincronizar la base de datos:', error.message);
//        process.exit(1); 
//    }
//}

//module.exports = { sequelize, connectDB };



module.exports = {
  sequelize, connectDB,
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres', // 👈 agrega el dialecto aquí
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
   protocol: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    }
  }
};
