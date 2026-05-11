const { Usuario } = require('../models/relations');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt'); // Falta esta importación para que funcione el hash

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Verificar si el usuario existe
        const usuario = await Usuario.findOne({ where: { email } });
        
        if (!usuario) {
            return res.status(404).json({ msg: "Este correo no está registrado en AEtech." });
        }

        // 2. Configurar el transporte de correo (Usa Gmail o Mailtrap para pruebas)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'tu-correo@gmail.com', // ⚠️ Usa variables de entorno (.env)
                pass: 'tu-password-de-aplicacion' 
            }
        });

        // 3. Contenido del correo
        const mailOptions = {
            from: '"AEtech Soporte" <soporte@aetech.com>',
            to: email,
            subject: 'Recuperación de Contraseña',
            html: `
                <div style="font-family: sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #00938f;">Hola, ${usuario.nombre}</h2>
                    <p>Has solicitado restablecer tu contraseña para la plataforma de gestión AEtech.</p>
                    <p>Haz clic en el siguiente botón para continuar:</p>
                    <a href="https://tu-app.netlify.app/reset-password.html?id=${usuario.id}" 
                       style="background: #00938f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                       Restablecer Contraseña
                    </a>
                    <p style="margin-top: 20px; font-size: 0.8em; color: #777;">Si no solicitaste esto, ignora este correo.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: "Correo enviado correctamente." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Hubo un error al enviar el correo." });
    }
};

exports.resetPassword = async (req, res) => {
    const { id, nuevaPassword } = req.body;

    try {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(nuevaPassword, salt);

        await usuario.save();

        res.json({ msg: "✅ Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar la contraseña" });
    }
};