// src/controllers/reporteController.js
const { Tarea, Actividad, Sucursal, ClienteNegocio, Evidencia, Usuario } = require('../models/relations');
const PDFDocument = require('pdfkit'); 

/**
 * Genera el reporte final de la tarea en formato PDF.
 * Solo accesible para Admin, Residente, e Ingeniero.
 */
exports.generateReportePDF = async (req, res) => {
    const { tareaId } = req.params;

    try {
        // 1. Obtener todos los datos necesarios para el reporte
        const reporteData = await Tarea.findByPk(tareaId, {
            include: [
                { model: Actividad, attributes: ['nombre', 'descripcion', 'campos_evidencia'] },
                { model: Sucursal, attributes: ['nombre', 'direccion'] },
                { model: ClienteNegocio, attributes: ['nombre'] },
                { model: Usuario, as: 'AsignadoA', attributes: ['nombre'] },
                { model: Evidencia, 
                  attributes: ['datos_recopilados', 'observaciones', 'createdAt'],
                  include: [{ model: Usuario, as: 'Autor', attributes: ['nombre'] }] 
                }
            ]
        });

        if (!reporteData) {
            return res.status(404).json({ message: 'Tarea no encontrada.' });
        }
        if (reporteData.estado !== 'Completada' || !reporteData.Evidencium) {
            return res.status(400).json({ message: 'El reporte solo puede generarse para tareas completadas y con evidencia.' });
        }

        // 2. Configurar el encabezado de la respuesta para PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_Tarea_${tareaId}.pdf`);

        // 3. Crear el documento PDF y hacer el pipe al stream de respuesta
        const doc = new PDFDocument();
        doc.pipe(res); 

        // 4. Contenido del PDF
        doc.fontSize(18).text('REPORTE DE SERVICIO COMPLETADO', { align: 'center' });
        doc.moveDown();

        // Sección de Cliente y Servicio
        doc.fontSize(14).text('Detalles del Servicio', { underline: true });
        doc.fontSize(12).moveDown(0.5);
        doc.text(`Cliente: ${reporteData.ClienteNegocio.nombre}`);
        doc.text(`Ubicación: ${reporteData.Sucursal.nombre}`);
        doc.text(`Dirección: ${reporteData.Sucursal.direccion}`);
        doc.text(`Tipo de Actividad: ${reporteData.Actividad.nombre}`);
        doc.text(`Asignado a: ${reporteData.AsignadoA.nombre}`);
        doc.text(`Fecha de Finalización: ${reporteData.Evidencium.createdAt.toLocaleDateString()}`);
        doc.moveDown();
        
        // Sección de Evidencia
        doc.fontSize(14).text('EVIDENCIA RECOPILADA EN CAMPO', { underline: true });
        doc.moveDown(0.5);
        
        const datos = reporteData.Evidencium.datos_recopilados;
        for (const key in datos) {
            doc.fontSize(12).text(`- ${key}:`, { continued: true })
               .text(`${datos[key]}`);
        }
        
        // Sección de Observaciones
        doc.moveDown();
        doc.fontSize(14).text('OBSERVACIONES DEL TÉCNICO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(reporteData.Evidencium.observaciones || 'No se registraron observaciones adicionales.');

        // 5. Finalizar el documento
        doc.end();

    } catch (error) {
        console.error('Error en la generación de PDF:', error);
        res.status(500).json({ message: 'Error interno del servidor al generar el PDF.' });
    }
};