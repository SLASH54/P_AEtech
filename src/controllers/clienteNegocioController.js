// src/controllers/clienteNegocioController.js
const ClienteNegocio = require('../models/ClienteNegocio');

// 1. CREAR Cliente de Negocio (Solo Admin)
exports.createClienteNegocio = async (req, res) => {
    try {
        const cliente = await ClienteNegocio.create(req.body);
        return res.status(201).json({ message: 'Cliente registrado con éxito', cliente });
    } catch (error) {
        console.error("Error al registrar cliente:", error);
        return res.status(500).json({ message: 'Error interno del servidor al crear cliente.' });
    }
};

// 2. OBTENER TODOS los Clientes (Solo Admin)
exports.getAllClientesNegocio = async (req, res) => {
    try {
        const clientes = await ClienteNegocio.findAll();
        return res.json(clientes);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener clientes.' });
    }
};

// 3. ACTUALIZAR Cliente (Solo Admin)
exports.updateClienteNegocio = async (req, res) => {
    try {
        const [updated] = await ClienteNegocio.update(req.body, {
            where: { id: req.params.id }
        });

        if (updated) {
            const cliente = await ClienteNegocio.findOne({ where: { id: req.params.id } });
            return res.json({ message: 'Cliente actualizado con éxito', cliente });
        }
        return res.status(404).json({ message: 'Cliente no encontrado.' });
    } catch (error) {
        console.error("Error al actualizar cliente:", error);
        return res.status(500).json({ message: 'Error interno del servidor al actualizar cliente.' });
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
    // El ID se extrae de los parámetros de la URL
    const clienteId = req.params.id; 

    try {
        // Lógica de Sequelize: Buscar el cliente por ID
        const cliente = await ClienteNegocio.findOne({
            where: { id: clienteId }
            // Nota: Aquí no excluimos la contraseña ya que los clientes no la tienen
        });

        if (!cliente) {
            // Si el cliente no existe, devuelve 404
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        // Si se encuentra, devuelve los datos del cliente (status 200 OK)
        res.json(cliente);

    } catch (error) {
        console.error(`Error al obtener cliente ID ${clienteId}:`, error);
        // Devuelve un error 500 para fallos del servidor
        res.status(500).json({ message: 'Error en el servidor al buscar el cliente.' });
    }
};

