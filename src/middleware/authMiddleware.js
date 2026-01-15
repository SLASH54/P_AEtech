// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
// Asegúrate de que tu JWT_SECRET está en el archivo .env
const JWT_SECRET = process.env.JWT_SECRET; 

// Middleware 1: Protege la ruta verificando la validez del token
exports.protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Verifica el token usando la clave secreta
            const decoded = jwt.verify(token, JWT_SECRET);

            // Adjunta la información del usuario (id, rol) a la petición
            req.user = decoded; 
            
            next();
        } catch (error) {
            return res.status(401).json({ message: 'No autorizado, token fallido o inválido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, no se encontró token.' });
    }
};

// Middleware 2: Verifica que el usuario sea Administrador
exports.admin = (req, res, next) => {
    const usuarioEspecial = "denisse.espinoza@aetech.com.mx";

    // Revisa la información de rol adjuntada por 'protect'
    if (req.user && (req.user.rol === 'Admin' || req.user.email === usuarioEspecial)) {
        next(); 
    } else {
        res.status(403).json({ message: 'Acceso denegado. Solo para Administradores.' });
    }
};

// Middleware 3: Verifica que el usuario tenga UNO de los roles permitidos
exports.rol = (rolesPermitidos) => (req, res, next) => {
    const usuarioEspecial = "denisse.espinoza@aetech.com.mx";
    const usuarioEmail = req.user.email;
    
    // 1. Verificar si el usuario está autenticado (protegido por el middleware 'protect')
    if (!req.user || !req.user.rol) {
        return res.status(401).json({ message: 'No autenticado o rol no definido.' });
    }

    const usuarioRol = req.user.rol;

    // 2. CORRECCIÓN CRÍTICA: Dar acceso total al rol 'Admin'
    if (usuarioRol === 'Admin') {
        return next(); // Si es Admin, pasa la solicitud sin verificar la lista de roles
    }

    // 3. Si no es Admin, verificar si su rol está en la lista de roles permitidos
    if (rolesPermitidos.includes(usuarioRol)) {
        next();
    } else {
        res.status(403).json({
            message: 'Acceso denegado. Rol insuficiente.',
            accion: 'Acceso a la ruta',
            requiredRoles: rolesPermitidos,
            currentRole: usuarioRol
        });
    }
};

console.log('authMiddleware cargado correctamente:', {
  protect: typeof exports.protect,
  rol: typeof exports.rol,
  admin: typeof exports.admin
});
