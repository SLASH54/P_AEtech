// src/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, logoutUser} = require('../controllers/authController');

const router = express.Router();

// Ruta POST para registrar (http://localhost:3000/api/auth/register)
router.post('/register', registerUser);

// Ruta POST para iniciar sesión (http://localhost:3000/api/auth/login)
router.post('/login', loginUser);

// POST /api/auth/logout
router.post('/logout', logoutUser); // <--- Nueva ruta


module.exports = router;