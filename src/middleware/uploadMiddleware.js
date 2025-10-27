// src/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento (memoria)
//const storage = multer.memoryStorage();




// 📁 Crear carpeta temporal si no existe
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// 🧠 Configurar almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });




// Configuración del filtro y límites
//const upload = multer({
//  storage,
//  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
//  fileFilter: (req, file, cb) => {
//    const filetypes = /jpeg|jpg|png|pdf|webp/;
//    const mimetype = filetypes.test(file.mimetype);
//    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//    if (mimetype && extname) return cb(null, true);
//    cb(new Error('Solo se permiten imágenes y archivos PDF.'));
//  },
//});

// ✅ Exporta directamente la instancia, NO un objeto
module.exports = upload;
