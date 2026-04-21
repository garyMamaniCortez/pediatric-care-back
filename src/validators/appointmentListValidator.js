const { body, query, param } = require('express-validator');

const appointmentListValidations = {
  getAppointments: [
    query('date')
      .optional()
      .isISO8601().withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)')
      .toDate(),
    query('startDate')
      .optional()
      .isISO8601().withMessage('La fecha de inicio debe tener formato ISO 8601 (YYYY-MM-DD)')
      .toDate(),
    query('endDate')
      .optional()
      .isISO8601().withMessage('La fecha de fin debe tener formato ISO 8601 (YYYY-MM-DD)')
      .toDate()
      .custom((endDate, { req }) => {
        if (req.query.startDate && endDate && req.query.startDate > endDate) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
        return true;
      }),
  ],

  createAppointment: [
    body('patientId')
      .notEmpty().withMessage('El ID del paciente es requerido')
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido'),
    
    body('serviceId')
      .notEmpty().withMessage('El ID del servicio es requerido')
      .isUUID().withMessage('El ID del servicio debe ser un UUID válido'),
    
    body('date')
      .notEmpty().withMessage('La fecha es requerida')
      .isISO8601().withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)')
      .toDate()
      .custom((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          throw new Error('La fecha no puede ser anterior al día actual');
        }
        return true;
      }),
    
    body('time')
      .notEmpty().withMessage('La hora es requerida')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe tener formato HH:MM (24 horas)'),
  ],

  updateAppointment: [
    param('id')
      .notEmpty().withMessage('El ID de la cita es requerido')
      .isUUID().withMessage('El ID de la cita debe ser un UUID válido'),
    
    body('patientId')
      .optional()
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido'),
    
    body('serviceId')
      .optional()
      .isUUID().withMessage('El ID del servicio debe ser un UUID válido'),
    
    body('date')
      .optional()
      .isISO8601().withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)')
      .toDate()
      .custom((date) => {
        if (date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date < today) {
            throw new Error('La fecha no puede ser anterior al día actual');
          }
        }
        return true;
      }),
    
    body('time')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe tener formato HH:MM (24 horas)'),
    
    body('status')
      .optional()
      .isIn(['pendiente', 'completada', 'cancelada']).withMessage('El estado debe ser: pendiente, completada o cancelada'),
  ],

  cancelAppointment: [
    param('id')
      .notEmpty().withMessage('El ID de la cita es requerido')
      .isUUID().withMessage('El ID de la cita debe ser un UUID válido'),
  ],
};

module.exports = appointmentListValidations;