// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { connectDB, sequelize } = require('./src/config/database');

// Cargar relaciones (MUY IMPORTANTE)
require('./src/models/relations');

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
