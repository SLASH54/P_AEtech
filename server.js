// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { connectDB, sequelize } = require('./src/config/database');

// Cargar relaciones (MUY IMPORTANTE)
require('./src/models/relations');
require('./src/models/cuentasRelations');

// Crear app
const app = express();

// === CORS ===
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://aetechprueba.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'), false);
    }
  }
}));

// === Middleware ===
// 🚀 Aumentamos el límite a 50MB para que las fotos de levantamientos en Base64 no den error 413
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === Rutas estáticas (ANTES de las rutas y ANTES del server.listen!!) ===
app.use('/public', express.static(path.join(__dirname, 'public')));

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// === Importación de rutas ===
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/clientes', require('./src/routes/clienteNegocioRoutes'));
app.use('/api/sucursales', require('./src/routes/sucursalRouthes'));
app.use('/api/actividades', require('./src/routes/actividadRoutes'));
app.use('/api/tareas', require('./src/routes/tareaRoutes'));
app.use('/api/evidencias', require('./src/routes/evidenciaRoutes'));
app.use('/api/reportes', require('./src/routes/reporteRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/notificaciones', require('./src/routes/NotificacionRoutes'));
app.use("/api/levantamientos", require("./src/routes/LevantamientosRoutes"));
app.use('/api/cuentas', require('./src/routes/cuentaRoutes'));

// Ruta exclusiva para el Cronjob - NO TOCA LA BASE DE DATOS
app.get('/api/keep-alive', (req, res) => {
  console.log('Keep-alive: El servidor sigue despierto, Neon sigue durmiendo. 😴');
  res.status(200).send('Servidor activo');
});


// === INICIO DEL SERVIDOR – SOLO UNA VEZ ===
connectDB()
  .then(() => {
   console.log('✅ Base de datos conectada correctamente');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ No se pudo iniciar el servidor:', err);
  });


// server.js final

// === INICIO DEL SERVIDOR – CON CREACIÓN MANUAL DE TABLA ===
//connectDB()
//  .then(async () => {
//    console.log('✅ Base de datos conectada correctamente');

//    try {
      // 🛠️ ESTE ES EL COMANDO SQL QUE CAMBIA TODO:
      // Crea la tabla "libreta" donde se anotan los múltiples usuarios por tarea
//      await sequelize.query(`
//        CREATE TABLE IF NOT EXISTS "TareaUsuarios" (
//          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//          "tareaId" INTEGER REFERENCES "Tareas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
//         "usuarioId" INTEGER REFERENCES "Usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
//          PRIMARY KEY ("tareaId", "usuarioId")
//        );
//      `);
//      console.log('✅ Tabla TareaUsuarios lista para guardar múltiples técnicos');
//    } catch (dbError) {
//      console.error('⚠️ Error al verificar tabla TareaUsuarios:', dbError.message);
//    }

    // Sync normal sin alter:true para evitar errore s de ENUM
//    await sequelize.sync(); 
//    console.log('🚀 Servidor sincronizado y listo');

//    const PORT = process.env.PORT || 3000;
//    app.listen(PORT, () => {
//      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
//    });
//  });