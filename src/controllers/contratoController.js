const Contrato = require('../models/Contrato');
const PDFDocument = require("pdfkit");


// 🔹 Guardar nuevo contrato con firma en la Base de Datos
exports.crearContrato = async (req, res) => {
    try {
        // 1. Extraemos los datos que enviamos desde el fetch del frontend
        const { clienteNombre, clienteRFC, firmaCliente, firmaDueno } = req.body;

        // 2. Validación básica
        if (!clienteNombre || !firmaCliente || !firmaDueno) {
            return res.status(400).json({ 
                success: false, 
                msg: "⚠️ Faltan datos: Nombre, Firma Cliente o Firma Dueño son obligatorios." 
            });
        }

        // 3. Guardamos en Neon usando los nombres del MODELO (izquierda) 
        // y los datos del REQ.BODY (derecha)
        const nuevoContrato = await Contrato.create({
            cliente_nombre: clienteNombre,
            cliente_rfc:    clienteRFC,
            firma_cliente:  firmaCliente, // <--- Importante que coincida con el modelo
            firma_dueno:    firmaDueno    // <--- Nueva columna
        });

        res.status(201).json({ 
            success: true, 
            msg: "✅ Contrato guardado con éxito en AEtech", 
            id: nuevoContrato.id 
        });

    } catch (error) {
        console.error("❌ Error en crearContrato:", error);
        res.status(500).json({ 
            success: false, 
            msg: "Error de servidor: " + error.message 
        });
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


