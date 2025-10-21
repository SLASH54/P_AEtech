const multer = require('multer');
const path = require('path');

const fs = require('fs');


const uploadPath = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const uniq = Date.now() + '-' + Math.round(Math.random()*1e9);
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${uniq}${ext}`);
  }
});

const allowed = new Set(['image/jpeg','image/png','image/webp','application/pdf']);
const fileFilter = (req, file, cb) => {
  if (allowed.has(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de archivo no permitido'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB por archivo
});

module.exports = { upload };
