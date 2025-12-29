// src/controllers/uploadController.js
const uploadMiddleware = require('../config/multerConfig');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configuración (Usa tus datos del .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Esta es la función que ya tienes, pero mejorada
exports.handlePhotoUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No hay archivo' });

    // 1. Subir a Cloudinary desde la carpeta temporal
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'levantamientos'
    });

    // 2. Borrar el archivo temporal de tu servidor (para no llenar espacio)
    fs.unlinkSync(req.file.path);

    // 3. Devolvemos la URL segura de Cloudinary al frontend
    res.json({
      message: 'Foto subida con éxito.',
      filePath: result.secure_url 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al subir a Cloudinary' });
  }
};