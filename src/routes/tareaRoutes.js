// src/routes/tareaRoutes.js
const express = require('express');
const tareaController = require('../controllers/tareaController');
const { protect, rol } = require('../middleware/authMiddleware'); 

const router = express.Router();

const rolesGestion = ['Admin', 'Ingeniero'];

//RECORDATORIO
router.post('/:id/recordatorio', authMiddleware, tareaController.enviarRecordatorioPush);

// TAREA EXPRESS
// Ruta para que el usuario solicite (Cualquier rol logueado)
router.post('/express', protect, tareaController.solicitarTareaExpress);

// Ruta para que el admin autorice (Solo Admin)
router.put('/autorizar/:id', protect, rol(['Admin']), tareaController.autorizarTarea);


// Rutas Generales de Asignación y Consulta
router.route('/')
    // POST: Crear Tarea (Asignar) - Solo Admin/Ingeniero
    .post(protect, rol(rolesGestion), tareaController.createTarea)
    // GET: Listar TODAS las Tareas (Monitoreo) - Solo Admin/Ingeniero
    .get(protect, rol(rolesGestion), tareaController.getAllTareas); 

// Ruta Específica para el Técnico (Residente/Practicante)
router.get('/mis-tareas', protect, tareaController.getTareasAsignadas); 
// Nota: No necesita 'rol()' porque cualquier usuario logueado (protect) puede ver SUS tareas.

// Rutas con ID (PUT y DELETE)
router.route('/:id')
    // PUT: Actualizar Tarea - Solo Admin/Ingeniero
    .put(protect, rol(rolesGestion), tareaController.updateTarea)
    // DELETE: Eliminar Tarea - Solo Admin
    .delete(protect, rol(['Admin']), tareaController.deleteTarea);

module.exports = router;