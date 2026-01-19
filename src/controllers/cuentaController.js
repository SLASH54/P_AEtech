// src/controllers/cuentaController.js
const { Cuenta, CuentaMaterial, Usuario } = require('../models/relations');
const cloudinary = require('cloudinary').v2;

// ☁️ La configuración ya la tienes, pero asegúrate de que use tus variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.crearCuenta = async (req, res) => {
    // Dentro de crearCuenta en cuentaController.js
    const saldoCalculado = total - anticipo;
    let estatusInicial = 'Pendiente';

    if (saldoCalculado <= 0) {
        estatusInicial = 'Pagado';
    }

    try {
        const { 
            clienteNombre, 
            total, 
            anticipo, 
            iva, 
            ivaPorcentaje, 
            factura, 
            folioFactura, 
            materiales 
        } = req.body;


        // 1. Crear la cabecera de la cuenta
        const nuevaCuenta = await Cuenta.create({
            clienteNombre,
            total,
            anticipo,
            saldo: total - anticipo,
            iva,
            ivaPorcentaje,
            factura,
            folioFactura,
            usuarioId: req.user.id,
            saldo: saldoCalculado,
            estatus: estatusInicial
        });

        // 2. Procesar Materiales y subir fotos a Cloudinary
        if (materiales && materiales.length > 0) {
            // Usamos Promise.all para procesar las fotos en paralelo (más rápido)
            const materialesProcesados = await Promise.all(materiales.map(async (mat) => {
                let urlFotoCloudinary = null;

                // Si viene una foto en base64, la subimos
                if (mat.fotoUrl && mat.fotoUrl.startsWith('data:image')) {
                    try {
                        const uploadRes = await cloudinary.uploader.upload(mat.fotoUrl, {
                            folder: 'cuentas_materiales'
                        });
                        urlFotoCloudinary = uploadRes.secure_url;
                    } catch (err) {
                        console.error("Error subiendo foto a Cloudinary:", err);
                    }
                }

                return {
                    nombre: mat.nombre,
                    cantidad: mat.cantidad || 1,
                    costo: mat.costo,
                    unidad: mat.unidad || 'Pza',
                    fotoUrl: urlFotoCloudinary, // Guardamos la URL de la nube
                    cuentaId: nuevaCuenta.id
                };
            }));

            // 3. Ahora sí, guardamos todos los materiales con sus URLs de fotos
            await CuentaMaterial.bulkCreate(materialesProcesados);
        }

        res.status(201).json({
            message: "Cuenta y materiales registrados exitosamente",
            id: nuevaCuenta.id
        });

    } catch (error) {
        console.error('Error al crear cuenta:', error);
        res.status(500).json({ message: "Error interno del servidor al guardar la cuenta." });
    }
};

// Función para obtener todas las cuentas (para tu tabla principal)
exports.obtenerCuentas = async (req, res) => {
    try {
        const cuentas = await Cuenta.findAll({
            include: [
                { model: Usuario, attributes: ['nombre'] },
                { model: CuentaMaterial, as: 'materiales' } // Trae también sus productos
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(cuentas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener las cuentas." });
    }
};