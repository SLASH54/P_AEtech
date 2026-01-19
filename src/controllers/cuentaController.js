// src/controllers/cuentaController.js
const { Cuenta, CuentaMaterial, Usuario } = require('../models/cuentasRelations');
const cloudinary = require('cloudinary').v2;

// ☁️ Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.crearCuenta = async (req, res) => {
    try {
        // 1. PRIMERO recibimos los datos del cuerpo de la petición
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

        // 2. DESPUÉS calculamos el saldo y estatus
        const saldoCalculado = total - anticipo;
        let estatusInicial = 'Pendiente';

        if (saldoCalculado <= 0) {
            estatusInicial = 'Pagado';
        }

        // 3. Crear la cabecera de la cuenta
        const nuevaCuenta = await Cuenta.create({
            clienteNombre,
            total,
            anticipo,
            saldo: saldoCalculado,
            iva,
            ivaPorcentaje,
            factura,
            folioFactura,
            estatus: estatusInicial, // Usamos el estatus calculado
            usuarioId: req.user.id
        });

        // 4. Procesar Materiales y subir fotos a Cloudinary
        if (materiales && materiales.length > 0) {
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
                    fotoUrl: urlFotoCloudinary,
                    cuentaId: nuevaCuenta.id
                };
            }));

            // Guardamos todos los materiales
            await CuentaMaterial.bulkCreate(materialesProcesados);
        }

        res.status(201).json({
            message: "Cuenta registrada exitosamente",
            id: nuevaCuenta.id
        });

    } catch (error) {
        console.error('Error al crear cuenta:', error);
        res.status(500).json({ message: "Error interno del servidor al guardar la cuenta." });
    }
};

// Función para obtener todas las cuentas
exports.obtenerCuentas = async (req, res) => {
    try {
        const cuentas = await Cuenta.findAll({
            include: [
                { model: Usuario, attributes: ['nombre'] },
                { model: CuentaMaterial, as: 'materiales' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(cuentas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener las cuentas." });
    }
};