// src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});

const upload = multer({ storage });

const uploadMultiple = upload.array('archivos', 10); // ✅ función

//module.exports = { uploadMultiple };
module.exports = upload;


