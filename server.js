// server.js
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/database');
require('dotenv').config();
require('./src/models/relations');
const path = require('path');

const { sequelize } = require('./src/config/database');


connectDB().then(async () => {
  try {
    await sequelize.sync(); // 🔥 CREA o actualiza tablas automáticamente
    console.log('✅ Tablas sincronizadas correctamente');
  } catch (err) {
    console.error('❌ Error al sincronizar tablas:', err);
  }

  app.listen(process.env.PORT, () =>
    console.log(`Servidor en http://localhost:${process.env.PORT}`)
  );
});


// 2. Definir los orígenes permitidos
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3001', 'https://aetechprueba.netlify.app']; // Añade aquí las URLs de tu frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como Postman o apps móviles)
    if (!origin) return callback(null, true); 
    // Si el origen está en nuestra lista de permitidos
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'), false);
    }
  }
};

// 3. Aplicar el middleware CORS
 // <-- ¡Aplicación del middleware!

 
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usa el puerto del .env o el 3000 por defecto
const PORT = process.env.PORT || 3000; 



// ===========================================
// 1. CARGA DE MODELOS
// ===========================================
// Esto es CRÍTICO: Carga todos los modelos para que Sequelize pueda 
// sincronizar las tablas en la base de datos (PostgreSQL).

const Usuario = require('./src/models/Usuario');
const Sucursal = require('./src/models/Sucursal'); 
const ClienteNegocio = require('./src/models/ClienteNegocio'); // <-- ¡Nuevo!
const Actividad = require('./src/models/Actividad');
const Tarea = require('./src/models/Tarea');
const Evidencia = require('./src/models/Evidencia');



// ... (en la función connectDB, no necesitas hacer nada más si ya sincroniza todos los modelos)

// Asume que también tienes archivos (aunque estén vacíos por ahora):
// require('./src/models/Tarea'); 
// require('./src/models/Evidencia'); 


// ===========================================
// 2. MIDDLEWARES GLOBALES
// ===========================================
// Middleware para leer peticiones JSON (CRÍTICO para recibir datos de login/register)
app.use(express.json()); 
// Middleware para leer datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true })); 
app.use(cors(corsOptions));
app.use('/api/auth', require('./src/routes/authRoutes'));




// ===========================================
// 3. MONTAJE DE RUTAS
// ===========================================
// Importa las rutas de autenticación
const authRoutes = require('./src/routes/authRoutes');
const clienteRoutes = require('./src/routes/clienteNegocioRoutes');
const sucursalRoutes = require('./src/routes/sucursalRouthes');
const actividadRoutes = require('./src/routes/actividadRoutes');
const tareaRoutes = require('./src/routes/tareaRoutes');
const evidenciaRoutes = require('./src/routes/evidenciaRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const NotificacionRoutes = require('./src/routes/NotificacionRoutes');



// Monta las rutas de autenticación en /api/auth
// Las peticiones a /api/auth/register y /api/auth/login funcionarán aquí.
app.use('/api/auth', authRoutes); 
// Servir archivos de imágenes subidas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));





// Importar y usar rutas de administración de usuarios
const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes); // Monta las rutas en /api/users
app.use('/api/clientes', clienteRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/actividades', actividadRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/evidencias', evidenciaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/upload', uploadRoutes)
app.use('/api/notificaciones', NotificacionRoutes)




// ===========================================
// 4. INICIO DE LA APLICACIÓN
// ===========================================
// Primero conecta la DB y luego inicia el servidor
connectDB().then(() => {
 app.listen(process.env.PORT, () =>
    console.log(`Servidor en http://localhost:${process.env.PORT}`)
  );
}).catch(err => {
    console.error('La aplicación no pudo iniciarse debido a un error de DB/conexión.');
    console.error(err);
});


//Servir Archivos Estaticos y carpeta uploads
const fs = require('fs');
// ...
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Servir estáticos:
app.use('/uploads', express.static(uploadsDir));  // <— URL pública: https://tu-backend/uploads/filename



