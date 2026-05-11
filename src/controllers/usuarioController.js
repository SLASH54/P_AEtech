const Usuario = require('../models/UsuarioContraseña'); // Importación directa
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt'); // Importación verificada

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(404).json({ msg: "Este correo no está registrado en AEtech." });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'tu-correo@gmail.com',
                pass: 'tu-password-de-aplicacion' 
            }
        });

        const mailOptions = {
            from: '"AEtech Soporte" <soporte@aetech.com>',
            to: email,
            subject: 'Recuperación de Contraseña',
            html: `<h1>Hola, ${usuario.nombre}</h1><p>Usa el enlace para recuperar tu clave.</p>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: "Correo enviado correctamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al enviar el correo." });
    }
};

exports.resetPassword = async (req, res) => {
    const { id, nuevaPassword } = req.body;
    try {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(nuevaPassword, salt);
        await usuario.save();

        res.json({ msg: "✅ Contraseña actualizada correctamente." });
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar la contraseña" });
    }
};