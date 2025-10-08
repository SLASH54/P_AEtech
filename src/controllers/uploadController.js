// src/controllers/uploadController.js
const uploadMiddleware = require('../config/multerConfig');
const path = require('path');

// Middleware para la subida de un solo archivo. 
// 'photo' DEBE coincidir con el nombre del campo del archivo que envía el cliente (ej. en Postman).
exports.uploadSinglePhoto = uploadMiddleware.single('photo');

/**
 * Controlador que se ejecuta DESPUÉS de que multer ha subido el archivo.
 * Devuelve la ruta relativa que se guardará en la base de datos.
 */
exports.handlePhotoUpload = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo o el tipo de archivo no es válido.' });
    }

    // La URL que guardaremos en la base de datos
    // path.join('uploads', req.file.filename) resultará en algo como: uploads/photo-123456789.jpg
    const fileUrl = path.join('uploads', req.file.filename); 
    
    // NOTA: Esta es la URL que el frontend deberá guardar en el campo 'datos_recopilados' de la Evidencia.
    res.json({
        message: 'Foto subida con éxito.',
        filePath: fileUrl
    });
};