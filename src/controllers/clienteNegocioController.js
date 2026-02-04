// src/controllers/clienteNegocioController.js
const ClienteNegocio = require('../models/ClienteNegocio');
const ClienteDireccion = require('../models/ClienteDireccion');

// Al inicio de tu LevantamientosController.js asegúrate de tener:
const { Levantamiento, Cliente } = require("../models"); // Importamos Cliente también

// ===============================
// 1. CREAR LEVANTAMIENTO (CON SOPORTE EXPRESS)
// ===============================
exports.createLevantamiento = async (req, res) => {
  try {
    const { 
      cliente_id, 
      cliente_nombre, 
      direccion, 
      personal, 
      fecha, 
      necesidades, 
      materiales,
      es_express // <--- Recibimos la bandera express
    } = req.body;

    let finalClienteId = cliente_id;

    // 🚀 LÓGICA EXPRESS: Si es nuevo, lo creamos primero
    if (es_express) {
      const nuevoCliente = await Cliente.create({
        nombre: cliente_nombre,
        direccion_principal: direccion, // O el campo que uses en tu tabla Clientes
        telefono: "S/N", // Datos temporales
        correo: "express@aetech.com",
        notas: "Cliente registrado vía Levantamiento Express"
      });
      finalClienteId = nuevoCliente.id; // Asignamos el ID recién creado
    }
    
    const necesidadesProcesadas = [];

    // Procesamiento de imágenes en Cloudinary (tu código actual...)
    if (necesidades && necesidades.length > 0) {
      for (const nec of necesidades) {
        let finalUrl = nec.imagen;
        if (nec.imagen && nec.imagen.startsWith('data:image')) {
          const result = await cloudinary.uploader.upload(nec.imagen, {
            folder: 'aetech_levantamientos',
            resource_type: 'auto'
          });
          finalUrl = result.secure_url;
        }
        necesidadesProcesadas.push({ descripcion: nec.descripcion, imagen: finalUrl });
      }
    }

    // Guardar el levantamiento con el ID real (sea el seleccionado o el nuevo express)
    const nuevoLevantamiento = await Levantamiento.create({
      cliente_id: finalClienteId,
      cliente_nombre,
      direccion,
      personal,
      fecha,
      necesidades: necesidadesProcesadas,
      materiales
    });

    res.status(201).json(nuevoLevantamiento);
  } catch (error) {
    console.error("Error al crear levantamiento:", error);
    res.status(500).json({ msg: "Error al crear el levantamiento" });
  }
};


// 1. CREAR Cliente de Negocio (Solo Admin)
//exports.createClienteNegocio = async (req, res) => {
//    try {
//        const body = req.body;

        // 🧱 Limpia emails vacíos para evitar errores por duplicados
//        if (body.email !== undefined && body.email.trim() === '') {
//            body.email = null;
//        }

//        const cliente = await ClienteNegocio.create(body);
//        return res.status(201).json({ message: 'Cliente registrado con éxito', cliente });
//    } catch (error) {
//        console.error("Error al registrar cliente:", error);
//        return res.status(500).json({ message: 'Error interno del servidor al crear cliente.' });
//    }
//};


// 2. OBTENER TODOS los Clientes (Solo Admin)
exports.getAllClientesNegocio = async (req, res) => {
    try {
        const clientes = await ClienteNegocio.findAll({
            include: [{ model: ClienteDireccion, as: "direcciones" }]
        });

        res.json(clientes);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ message: "Error interno al obtener clientes." });
    }
};



// 3. ACTUALIZAR Cliente (Solo Admin)
exports.updateClienteNegocio = async (req, res) => {
    try {
        const clienteId = req.params.id;
        const { nombre, email, telefono, alias = [], estado = [], municipio = [], direccion = [], maps = [] } = req.body;

        const emailFinal = email?.trim() === "" ? null : email;

        const cliente = await ClienteNegocio.findByPk(clienteId);
        if (!cliente) return res.status(404).json({ message: "Cliente no encontrado." });

        await cliente.update({ nombre, email: emailFinal, telefono });

        // borrar direcciones existentes
        await ClienteDireccion.destroy({ where: { clienteId } });

        // volver a crear las nuevas
        for (let i = 0; i < direccion.length; i++) {
            await ClienteDireccion.create({
                clienteId,
                estado: estado[i],
                municipio: municipio[i],
                direccion: direccion[i],
                maps: maps[i] || null,
                alias: alias?.[i] || null
            });
        }

        res.json({ message: "Cliente actualizado", cliente });

    } catch (error) {
        console.error("Error actualizando cliente:", error);
        res.status(500).json({ message: "Error interno." });
    }
};



// 4. ELIMINAR Cliente (Solo Admin)
exports.deleteClienteNegocio = async (req, res) => {
    try {
        const deleted = await ClienteNegocio.destroy({
            where: { id: req.params.id }
        });

        if (deleted) {
            return res.json({ message: 'Cliente eliminado con éxito.' });
        }
        return res.status(404).json({ message: 'Cliente no encontrado.' });
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        return res.status(500).json({ message: 'Error interno del servidor al eliminar cliente.' });
    }
};

exports.getClienteNegocioById = async (req, res) => {
    const clienteId = req.params.id;

    try {
        const cliente = await ClienteNegocio.findOne({
            where: { id: clienteId },
            include: [{ model: ClienteDireccion, as: "direcciones" }]
        });

        if (!cliente) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        res.json(cliente);
    } catch (error) {
        console.error(`Error al obtener cliente ID ${clienteId}:`, error);
        res.status(500).json({ message: "Error interno." });
    }
};


