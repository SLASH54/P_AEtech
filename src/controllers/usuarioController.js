const Usuario = require('../models/UsuarioContraseña'); // Importación directa verificada
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // 1. Verificar si el usuario existe en la base de datos de AEtech
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(404).json({ msg: "Este correo no está registrado en AEtech." });
        }

        // 2. Configurar el transporte de correo
        // IMPORTANTE: Debes usar una "Contraseña de aplicación" de Google
        const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tu-correo@gmail.com', // 👈 Tu correo real
        pass: 'abcd efgh ijkl mnop'  // 👈 Tu clave de aplicación de 16 letras
    }
});

        // 3. Definir el contenido del correo
        const mailOptions = {
            from: '"AEtech Soporte" <TU_CORREO@gmail.com>', // Debe ser el mismo que 'user'
            to: email,
            subject: 'Recuperación de Contraseña - AEtech',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #00938f;">Hola, ${usuario.nombre}</h2>
                    <p>Recibimos una solicitud para restablecer tu contraseña en la plataforma <strong>AEtech</strong>.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://aetechprueba.netlify.app/reset-password.html?id=${usuario.id}" 
                           style="background-color: #00938f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                           Restablecer Contraseña
                        </a>
                    </div>
                    <p style="font-size: 0.8em; color: #777;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                </div>
            `
        };

        // 4. Enviar el correo
        await transporter.sendMail(mailOptions);
        res.json({ msg: "Correo enviado correctamente. Revisa tu bandeja de entrada." });

    } catch (error) {
        console.error("Error detallado:", error); // Esto saldrá en los logs de Render
        res.status(500).json({ msg: "Error al enviar el correo.", detalle: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { id, nuevaPassword } = req.body;
    try {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        // Simplemente asignamos la contraseña, el hook del modelo se encargará
        // o la encriptamos aquí si el hook no está configurado para updates.
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(nuevaPassword, salt);

        await usuario.save();
        res.json({ msg: "✅ Contraseña actualizada correctamente. Ya puedes iniciar sesión." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar la contraseña" });
    }
};


exports.quickReset = async (req, res) => {
    const { email, nuevaPassword } = req.body;
    try {
        // Buscamos al usuario por su correo
        const usuario = await Usuario.findOne({ where: { email } });
        
        if (!usuario) {
            return res.status(404).json({ msg: "Este correo no está registrado en AEtech." });
        }

        // Encriptamos la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(nuevaPassword, salt);

        // Guardamos los cambios
        await usuario.save();
        
        res.json({ msg: "Contraseña actualizada correctamente." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar la contraseña." });
    }
};