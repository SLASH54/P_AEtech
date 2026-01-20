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
                let urlCloudinary = null;

                // 🚀 CAMBIO CLAVE: Checar si 'foto' trae el Base64
                if (mat.foto && mat.foto.startsWith('data:image')) {
                    try {
                        const uploadRes = await cloudinary.uploader.upload(mat.foto, {
                        folder: "cuentas_aetech"
                    });
                    urlCloudinary = uploadRes.secure_url;
                        //urlFotoCloudinary = resCloud.secure_url;
                        console.log("✅ Foto de material subida:", urlCloudinary);
                    } catch (err) {
                        console.error("❌ Error en Cloudinary para material:", err);
                    }
                }

                return {
                    nombre: mat.nombre,
                    cantidad: mat.cantidad || 1,
                    costo: mat.costo,
                    unidad: mat.unidad || 'Pza',
                    fotoUrl: urlCloudinary, // Se guarda la URL final
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


exports.eliminarCuenta = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar la cuenta y sus materiales para obtener las URLs de las fotos
        const cuenta = await Cuenta.findByPk(id, {
            include: [{ model: CuentaMaterial, as: 'materiales' }]
        });

        if (!cuenta) {
            return res.status(404).json({ message: "Cuenta no encontrada" });
        }

        // 2. (Opcional) Borrar fotos de Cloudinary si quieres limpiar espacio
        for (const mat of cuenta.materiales) {
            if (mat.fotoUrl && mat.fotoUrl.includes("cloudinary")) {
                const publicId = mat.fotoUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`cuentas_aetech/${publicId}`).catch(err => console.log("Error borrando en Cloudinary:", err));
            }
        }

        // 3. Eliminar la cuenta (Gracias al CASCADE en la relación, borrará los materiales automáticamente)
        await cuenta.destroy();

        res.json({ message: "Cuenta eliminada correctamente" });

    } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        res.status(500).json({ message: "Error interno al eliminar" });
    }
};