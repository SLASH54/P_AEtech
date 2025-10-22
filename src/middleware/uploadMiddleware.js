// src/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento (memoria)
const storage = multer.memoryStorage();

// Configuración del filtro y límites
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Solo se permiten imágenes y archivos PDF.'));
  },
});

// ✅ Exporta directamente la instancia, NO un objeto
module.exports = upload;
