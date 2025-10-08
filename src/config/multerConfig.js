const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Definir la ubicación de almacenamiento y el nombre del archivo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ruta absoluta a la carpeta 'uploads' en la raíz del proyecto
        const uploadPath = path.join(__dirname, '..', '..', 'uploads');
        // Asegurarse de que el directorio exista (crearlo si no existe)
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generar un nombre de archivo único basado en la marca de tiempo y un número aleatorio
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        // Formato: photo-1730999999999-123456789.jpg
        cb(null, 'photo-' + uniqueSuffix + fileExtension);
    }
});

// 2. Filtro para aceptar solo imágenes comunes
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
        cb(null, true); // Aceptar archivo
    } else {
        // Rechazar archivo
        cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (JPEG, PNG, WEBP).'), false);
    }
};

// 3. Configuración final para multer (límite de 5MB)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 4080 * 4080 * 10 // 5MB
    }
});

module.exports = upload;