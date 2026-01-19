// src/controllers/cuentaController.js
const { Cuenta, CuentaMaterial, Usuario } = require('../models/cuentasRelations');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.crearCuenta = async (req, res) => {
    try {
        // 1. Extraer datos del body PRIMERO
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

        // 2. Ahora sí calculamos (evita que truene por variables indefinidas)
        const totalNum = parseFloat(total) || 0;
        const anticipoNum = parseFloat(anticipo) || 0;
        const saldoCalculado = totalNum - anticipoNum;
        
        let estatusInicial = 'Pendiente';
        if (saldoCalculado <= 0) {
            estatusInicial = 'Pagado';
        }

        // 3. Crear la cabecera de la cuenta
        const nuevaCuenta = await Cuenta.create({
            clienteNombre,
            total: totalNum,
            anticipo: anticipoNum,
            saldo: saldoCalculado,
            iva,
            ivaPorcentaje,
            factura,
            folioFactura,
            estatus: estatusInicial,
            usuarioId: req.user.id 
        });

        // 4. Procesar Materiales
        if (materiales && materiales.length > 0) {
            const materialesProcesados = await Promise.all(materiales.map(async (mat) => {
                let urlFotoCloudinary = null;

                if (mat.fotoUrl && mat.fotoUrl.startsWith('data:image')) {
                    try {
                        const uploadRes = await cloudinary.uploader.upload(mat.fotoUrl, {
                            folder: 'cuentas_materiales'
                        });
                        urlFotoCloudinary = uploadRes.secure_url;
                    } catch (err) {
                        console.error("Error Cloudinary:", err);
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

            await CuentaMaterial.bulkCreate(materialesProcesados);
        }

        res.status(201).json({
            message: "Cuenta registrada exitosamente",
            id: nuevaCuenta.id
        });

    } catch (error) {
        console.error('ERROR AL GUARDAR CUENTA:', error);
        res.status(500).json({ 
            message: "Error interno", 
            error: error.message 
        });
    }
};

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
        res.status(500).json({ message: "Error al obtener las cuentas." });
    }
};