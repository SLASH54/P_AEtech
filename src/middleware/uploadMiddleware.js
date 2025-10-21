// src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});

const upload = multer({ storage });

const uploadMultiple = upload.fields([
  { name: 'archivos', maxCount: 10 },
  { name: 'firmaCliente', maxCount: 1 }
]);

module.exports = { uploadMultiple };



