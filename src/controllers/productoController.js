const Producto = require('../models/Producto');
const cloudinary = require('cloudinary').v2;

// Listar productos
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({ order: [['nombre', 'ASC']] });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener productos' });
  }
};

// Crear producto con imagen
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, costo, categoria } = req.body;
    let fotoUrl = null;

    // Si viene una foto, la subimos a una carpeta especial en Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'aetech_catalogo',
      });
      fotoUrl = result.secure_url;
    }

    const nuevoProducto = await Producto.create({
      nombre,
      costo,
      categoria,
      fotoUrl
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear producto' });
  }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
  try {
    await Producto.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Producto eliminado del catálogo' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar' });
  }
};