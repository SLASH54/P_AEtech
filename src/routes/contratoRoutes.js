const express = require('express');
const router = express.Router();
const Contrato = require('../models/Contrato');

// Ruta para guardar el contrato
router.post('/', async (req, res) => {
  try {
    const { clienteNombre, clienteRFC, firmaData } = req.body;
    const nuevoContrato = await Contrato.create({
      clienteNombre,
      clienteRFC,
      firmaData
    });
    res.status(201).json({ mensaje: 'Contrato guardado', id: nuevoContrato.id });
  } catch (error) {
    console.error('Error al guardar contrato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;