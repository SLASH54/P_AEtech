// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
require('dotenv').config(); 

// Obtener la clave secreta
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10; 

// ==============================================
// 1. REGISTRO DE USUARIO
// ==============================================
exports.registerUser = async (req, res) => {
    try {
        let { nombre, email, password } = req.body;
        
        // 1. Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        // 2. Determinar el rol: Si es el primer usuario en la DB, lo hacemos 'Admin'
        const userCount = await Usuario.count();
        // Si no hay usuarios, es Admin. Si ya hay, es el rol por defecto (ej. Practicante)
        const rol = (userCount === 0) ? 'Admin' : 'Practicante'; 

        // 3. Crear el usuario 
        const newUser = await Usuario.create({ 
            nombre, 
            email, 
            password: hashedPassword, 
            rol 
        });

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            usuario: { id: newUser.id, nombre: newUser.nombre, rol: newUser.rol }
        });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// ==============================================
// 2. INICIO DE SESIÓN
// ==============================================

const signAccessToken = (user) =>
  jwt.sign(
    { id: user.id, rol: user.rol }, 
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Antes: '1h'
  );

// CAMBIO: Incluimos el rol en el refresh para que persista al renovar
const signRefreshToken = (user) =>
  jwt.sign(
    { id: user.id, rol: user.rol }, 
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' } 
  );



exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar usuario
        const user = await Usuario.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 2. Comparar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Generar JWT
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);


        // 4. Responder con el token (sesión)
        res.json({
        message: 'Inicio de sesión exitoso.',
        accessToken,
        refreshToken,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        usuarioId: user.id
        });


    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};



// ==============================================
// 3. CIERRE DE SESIÓN (LOGOUT)
// ==============================================
exports.logoutUser = (req, res) => {
    // Nota: En un sistema JWT, el servidor simplemente confirma la acción.
    // La eliminación real del token ocurre en el cliente (navegador/app).
    res.status(200).json({ 
        message: 'Sesión cerrada exitosamente.' 
    });
};




// ==============================================
// 4. REFRESH TOKEN (CORREGIDO)
// ==============================================
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // CAMBIO CRÍTICO: Incluimos el ROL que viene del decoded
    // Si no pones el rol aquí, el middleware 'admin' te rechazará
    const newAccessToken = jwt.sign(
      { id: decoded.id, rol: decoded.rol }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Nuevo token dura otra semana
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error en Refresh:", error);
    res.status(401).json({ message: 'Refresh inválido o expirado' });
  }
};
