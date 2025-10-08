// src/routes/actividadRoutes.js
const express = require('express');
const actividadController = require('../controllers/actividadController');
const { protect, rol } = require('../middleware/authMiddleware'); 

const router = express.Router();

const rolesEscritura = ['Admin', 'Ingeniero'];

// Rutas sin ID (POST y GET All)
router.route('/')
    // POST: Crear (Solo Admin e Ingeniero)
    .post(protect, rol(rolesEscritura), actividadController.createActividad)
    // GET: Listar (Todos los usuarios logueados necesitan ver el catálogo)
    .get(protect, actividadController.getAllActividades); 

// Rutas con ID (PUT y DELETE)
router.route('/:id')
    // PUT: Actualizar (Solo Admin e Ingeniero)
    .put(protect, rol(rolesEscritura), actividadController.updateActividad)
    // DELETE: Eliminar (Solo Admin e Ingeniero)
    .delete(protect, rol(rolesEscritura), actividadController.deleteActividad);

module.exports = router;