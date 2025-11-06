// src/controllers/userController.js
const bcrypt = require('bcrypt');
//const Usuario = require('../models/Usuario');
const SALT_ROUNDS = 10;
const { Usuario } = require('../models/relations');

//exports.saveFcmToken = async (req, res) => {
//  try {
//    const userId = req.user.id;
//    const { token } = req.body;
//    if (!token) return res.status(400).json({ message: 'Falta token' });
//
//    await Usuario.update({ fcmToken: token }, { where: { id: userId } });
//    res.json({ message: 'FCM token guardado' });
//  } catch (e) {
//    console.error('saveFcmToken error:', e);
//    res.status(500).json({ message: 'Error guardando token' });
//  }
//};


// 1. VER TODOS LOS USUARIOS
exports.getAllUsers = async (req, res) => {
    try {
        // Excluimos la contraseña por seguridad
        const users = await Usuario.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
    }
};

// 2. EDITAR USUARIO (Solo Admin puede cambiar nombre, email, rol, y contraseña)
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // Capturamos todos los campos, incluyendo la nueva 'password'
        const { nombre, email, rol, password } = req.body;
        
        const updateFields = {};

        // 1. Verificación de Seguridad: No permitir que el Admin se auto-degrade
        if (req.user.id == userId && rol && rol !== 'Admin') {
            return res.status(403).json({ message: 'Un administrador no puede degradar su propio rol.' });
        }

        // 2. Preparar campos de actualización (si existen)
        if (nombre) updateFields.nombre = nombre;
        if (email) updateFields.email = email;
        if (rol) updateFields.rol = rol;

        // 3. CRÍTICO: HASH DE LA NUEVA CONTRASEÑA
        if (password) {
            // Si se proporciona una nueva contraseña, la hasheamos
            updateFields.password = await bcrypt.hash(password, SALT_ROUNDS);
        }

        // 4. Ejecutar la actualización en la DB
        const [updated] = await Usuario.update(
            updateFields, // Usamos el objeto con solo los campos existentes
            { where: { id: userId } }
        );

        if (updated) {
            // Buscar el usuario actualizado (excluyendo la contraseña)
            const updatedUser = await Usuario.findOne({ 
                where: { id: userId },
                attributes: { exclude: ['password'] }
            });
            return res.json({ message: 'Usuario actualizado con éxito', usuario: updatedUser });
        }

        res.status(404).json({ message: 'Usuario no encontrado.' });

    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// 3. ELIMINAR USUARIO
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // No permitir que el Admin se auto-elimine
        if (req.user.id == userId) {
            return res.status(403).json({ message: 'Un administrador no puede eliminarse a sí mismo.' });
        }

        const deleted = await Usuario.destroy({
            where: { id: userId }
        });

        if (deleted) {
            return res.json({ message: 'Usuario eliminado con éxito.' });
        }

        res.status(404).json({ message: 'Usuario no encontrado.' });

    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor al eliminar.' });
    }
};

exports.getUserById = async (req, res) => {
    const userId = req.params.id; 

    try {
        // 🔑 CORRECCIÓN PARA SEQUELIZE: Usamos findOne con la condición 'where'
        const user = await Usuario.findOne({
            where: { id: userId },
            // Excluir la contraseña (usando la sintaxis de Sequelize)
            attributes: { exclude: ['password'] } 
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Si se encuentra, devuelve los datos del usuario (status 200 OK)
        res.json(user);

    } catch (error) {
        console.error(`Error al obtener usuario ID ${userId}:`, error);
        res.status(500).json({ message: 'Error en el servidor al buscar el usuario.' });
    }
};

// =============================================================
// 🔔 Guardar token de notificaciones FCM
// =============================================================
exports.saveFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'Token FCM no proporcionado' });
    }

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuario.fcmToken = fcmToken;
    await usuario.save();

    res.status(200).json({ message: 'Token FCM guardado correctamente' });
  } catch (error) {
    console.error('Error al guardar token FCM:', error);
    res.status(500).json({ message: 'Error interno al guardar token FCM' });
  }
};


// 🔑 ¡CRÍTICO! DEJA SOLO UNA EXPORTACIÓN AL FINAL si defines todas las funciones individualmente
module.exports = {
    getAllUsers: exports.getAllUsers,
    updateUser: exports.updateUser,
    deleteUser: exports.deleteUser,
    getUserById: exports.getUserById, // <-- Esta línea funciona gracias a la corrección 1
    saveFcmToken: exports.saveFcmToken
};
