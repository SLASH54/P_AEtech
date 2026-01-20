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
        // 1. PRIMERO extraemos los datos del req.body
        const { 
            numeroNota,
            clienteNombre, 
            total, 
            anticipo, 
            iva, 
            ivaPorcentaje, 
            factura, 
            folioFactura, 
            materiales 
        } = req.body;

        // 2. AHORA SÍ calculamos (convertimos a número por seguridad)
        const nTotal = parseFloat(total) || 0;
        const nAnticipo = parseFloat(anticipo) || 0;
        const saldoCalculado = nTotal - nAnticipo;
        
        let estatusInicial = 'Pendiente';
        if (saldoCalculado <= 0) {
            estatusInicial = 'Pagado';
        }

        // 3. Crear la cabecera de la cuenta
        const nuevaCuenta = await Cuenta.create({
            numeroNota,
            clienteNombre,
            total: nTotal,
            anticipo: nAnticipo,
            saldo: saldoCalculado,
            iva,
            ivaPorcentaje,
            factura,
            folioFactura,
            estatus: estatusInicial,
            usuarioId: req.user.id 
        });

        // 4. Procesar Materiales y fotos
        if (materiales && materiales.length > 0) {
            const materialesProcesados = await Promise.all(materiales.map(async (mat) => {
                let urlFotoCloudinary = null;

                if (mat.foto && mat.foto.startsWith('data:image')) {
                    try {
                        const uploadRes = await cloudinary.uploader.upload(mat.foto, {
                            folder: 'cuentas_materiales'
                        });
                        urlFotoCloudinary = uploadRes.secure_url;
                        console.log("✅ Foto subida a Cloudinary:", urlFotoCloudinary); // 👈 Agrega esto para debug
                    } catch (err) {
                        console.error("Error en Cloudinary:", err);
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
        console.error('ERROR CRÍTICO:', error);
        res.status(500).json({ 
            message: "Error al guardar la cuenta",
            error: error.message 
        });
    }
};


exports.obtenerCuentas = async (req, res) => {
    try {
        const cuentas = await Cuenta.findAll({
            include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre'] }, // 👈 Usar alias 'usuario'
                { model: CuentaMaterial, as: 'materiales' } // 👈 Usar alias 'materiales'
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(cuentas);
    } catch (error) {
        console.error("Error en obtenerCuentas:", error);
        res.status(500).json({ message: "Error al obtener las cuentas." });
    }
};