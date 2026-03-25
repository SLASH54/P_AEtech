const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Tu middleware de Multer

// GET /api/productos
router.get('/', protect, productoController.obtenerProductos);

// POST /api/productos (Usamos upload.single para la foto)
router.post('/', protect, upload.single('foto'), productoController.crearProducto);

// DELETE /api/productos/:id
router.delete('/:id', protect, productoController.eliminarProducto);

//PUT /api/productos/:id
router.put('/:id', protect, upload.single('foto'), productoController.editarProducto);

module.exports = router;