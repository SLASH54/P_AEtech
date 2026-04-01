// src/controllers/cuentaController.js
const { Cuenta, CuentaMaterial, Usuario } = require('../models/cuentasRelations');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// En cuentaController.js
exports.obtenerCuentaPorIdPublica = async (req, res) => {
    try {
        const { id } = req.params;
        // En Sequelize usamos findByPk y cargamos los materiales de una vez
        const cuenta = await Cuenta.findByPk(id, {
            include: [{ model: CuentaMaterial, as: 'materiales' }]
        });

        if (!cuenta) {
            return res.status(404).json({ mensaje: "Nota no encontrada" });
        }

        res.json(cuenta);
    } catch (error) {
        console.error("Error en ruta pública:", error);
        res.status(500).json({ mensaje: "Error al obtener la nota" });
    }
};

exports.crearCuenta = async (req, res) => {
    try {
        // 1. PRIMERO extraemos los datos del req.body
        const { 
            numeroNota,
            clienteNombre,
            subtotal, 
            total, 
            anticipo, 
            iva, 
            ivaPorcentaje, 
            factura, 
            folioFactura, 
            materiales,
            fecha_anticipo, 
        } = req.body;

        // 2. AHORA SÍ calculamos (convertimos a número por seguridad)
        const nSubtotal = parseFloat(subtotal) || 0;
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
            subtotal: nSubtotal,
            total: nTotal,
            anticipo: nAnticipo,
            saldo: saldoCalculado,
            iva,
            ivaPorcentaje,
            factura,
            folioFactura,
            estatus: estatusInicial,
            usuarioId: req.user.id,
            fecha_anticipo: fecha_anticipo || new Date()
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

exports.editarCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { clienteNombre, subtotal, total, anticipo, iva, ivaPorcentaje, factura, folioFactura, materiales, fecha_anticipo } = req.body;

        const cuenta = await Cuenta.findByPk(id);
        if (!cuenta) return res.status(404).json({ message: "Cuenta no encontrada" });

        // 1. Recalcular saldo y estatus
        const nSubtotal = parseFloat(subtotal) || 0;
        const nTotal = parseFloat(total) || 0;
        const nAnticipo = parseFloat(anticipo) || 0;
        const saldoCalculado = nTotal - nAnticipo;
        const nuevoEstatus = saldoCalculado <= 0 ? 'Pagado' : 'Pendiente';

        // 2. Actualizar cabecera
        await cuenta.update({
            clienteNombre,
            subtotal : nSubtotal, 
            total: nTotal, 
            anticipo: nAnticipo,
            saldo: saldoCalculado, iva, ivaPorcentaje,
            factura, folioFactura, estatus: nuevoEstatus,
            fecha_anticipo
        });

        // 3. Manejar materiales (Eliminar anteriores y crear nuevos)
        // Nota: En una app más grande podrías comparar IDs, pero borrar y recrear es más limpio para prototipos
        await CuentaMaterial.destroy({ where: { cuentaId: id } });

        if (materiales && materiales.length > 0) {
            const materialesProcesados = await Promise.all(materiales.map(async (mat) => {
                let urlFinal = mat.fotoUrl;

                // Si la foto es nueva (Base64), subirla a Cloudinary
                if (mat.foto && mat.foto.startsWith('data:image')) {
                    const uploadRes = await cloudinary.uploader.upload(mat.foto, { folder: "cuentas_aetech" });
                    urlFinal = uploadRes.secure_url;
                }

                return {
                    nombre: mat.nombre,
                    cantidad: mat.cantidad || 1,
                    costo: mat.costo,
                    fotoUrl: urlFinal,
                    cuentaId: id
                };
            }));
            await CuentaMaterial.bulkCreate(materialesProcesados);
        }

        res.json({ message: "Cuenta actualizada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al editar la cuenta" });
    }
};

// Agrega esto a tu controlador
exports.liquidarCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        const cuenta = await Cuenta.findByPk(id);
        
        if (!cuenta) return res.status(404).send("Cuenta no encontrada");

        await cuenta.update({
            anticipo: cuenta.total,
            saldo: 0,
            estatus: 'Pagado',
            fechaLiquidacion: new Date() // 👈 Guardamos el momento exacto
        });

        res.json({ message: "Cuenta liquidada con éxito", cuenta });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al liquidar");
    }
};

exports.abonarALaCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { montoAbono } = req.body;
        
        const cuenta = await Cuenta.findByPk(id);
        if (!cuenta) return res.status(404).json({ message: "No se encontró la cuenta" });

        // Calculamos nuevos valores
        const nuevoAnticipo = parseFloat(cuenta.anticipo) + parseFloat(montoAbono);
        const nuevoSaldo = parseFloat(cuenta.total) - nuevoAnticipo;
        
        await cuenta.update({
            anticipo: nuevoAnticipo,
            saldo: nuevoSaldo,
            estatus: nuevoSaldo <= 0 ? 'Pagado' : 'Pendiente'
        });

        res.json({ message: "Abono aplicado correctamente", nuevoSaldo });
    } catch (error) {
        res.status(500).json({ message: "Error al procesar el abono" });
    }
};