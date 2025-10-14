// src/controllers/userController.js
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const SALT_ROUNDS = 10;

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


/**
 * @desc Obtener un solo usuario por ID
 * @route GET /users/:id
 * @access Private (Admin)
 */
async function getUserById(req, res) {
    // El ID se extrae de los parámetros de la URL (gracias a la ruta /:id)
    const userId = req.params.id; 

    try {
        // 🔑 Lógica de la Base de Datos: Busca el usuario por su ID
        // (Ajusta esta línea según tu ORM o método de DB)
        const user = await User.findById(userId).select('-password'); // Excluir la contraseña por seguridad

        if (!user) {
            // Si el usuario no existe, devuelve 404
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Si se encuentra, devuelve los datos del usuario (status 200 OK)
        res.json(user);

    } catch (error) {
        console.error(`Error al obtener usuario ID ${userId}:`, error);
        // Devuelve un error 500 para fallos del servidor
        res.status(500).json({ message: 'Error en el servidor al buscar el usuario.' });
    }
}

// Asegúrate de exportar la función para que tus rutas puedan usarla:
module.exports = {
    // ... Tus otras funciones (getAllUsers, updateUser, deleteUser, etc.)
    getUserById
};