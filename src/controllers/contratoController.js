const Contrato = require('../models/Contrato');
const PDFDocument = require("pdfkit");


exports.crearContrato = async (req, res) => {
    try {
        // 1. Agregamos domicilio, mesesContrato, fechaInicio y fechaFin a la extracción
        const { 
            clienteNombre, 
            clienteRFC, 
            domicilio, 
            mesesContrato, 
            fechaInicio, 
            fechaFin, 
            firmaCliente, 
            firmaDueno 
        } = req.body;

        // 2. Validación básica (puedes decidir si domicilio es obligatorio o no)
        if (!clienteNombre || !firmaCliente || !firmaDueno) {
            return res.status(400).json({ 
                success: false, 
                msg: "⚠️ Faltan datos obligatorios para AEtech." 
            });
        }

        // 3. Guardamos TODO en Neon usando los nombres del MODELO actualizado
        const nuevoContrato = await Contrato.create({
            cliente_nombre: clienteNombre,
            cliente_rfc:    clienteRFC,
            domicilio:      domicilio,      // <--- ¡NUEVO!
            meses_contrato: mesesContrato,  // <--- ¡NUEVO!
            fecha_inicio:   fechaInicio,    // <--- ¡NUEVO!
            fecha_fin:      fechaFin,       // <--- ¡NUEVO!
            firma_cliente:  firmaCliente,
            firma_dueno:    firmaDueno
        });

        res.status(201).json({ 
            success: true, 
            msg: "✅ Contrato completo guardado con éxito", 
            id: nuevoContrato.id 
        });

    } catch (error) {
        console.error("❌ Error en crearContrato:", error);
        res.status(500).json({ success: false, msg: error.message });
    }
};



// 🔹 Obtener historial de contratos (Arreglado para evitar error de createdAt)
exports.obtenerContratos = async (req, res) => {
    try {
        // Usamos 'id' para ordenar porque 'createdAt' no existe en tu tabla de Neon
        const contratos = await Contrato.findAll({ 
            order: [['id', 'DESC']] 
        });
        res.json(contratos);
    } catch (error) {
        console.error("❌ Error en obtenerContratos:", error);
        res.status(500).json({ 
            msg: "Error al obtener el listado de contratos" 
        });
    }
};


