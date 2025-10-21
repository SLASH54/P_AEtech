// src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 📂 carpeta donde se guardan los archivos
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombre = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, nombre);
  }
});

const upload = multer({ storage });

// Exportar correctamente las funciones de subida
module.exports = {
  uploadMultiple: upload.fields([
    { name: 'archivos', maxCount: 10 },
    { name: 'firmaCliente', maxCount: 1 } // ✅ añadimos soporte para la firma
  ])
};

