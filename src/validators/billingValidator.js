const { query, body } = require('express-validator');

const billingValidations = {
  getPendingPayments: [
    query('search')
      .optional()
      .trim()
      .isString().withMessage('El término de búsqueda debe ser texto')
      .isLength({ max: 100 }).withMessage('El término de búsqueda no puede exceder 100 caracteres'),
    
    query('date')
      .optional()
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha debe tener formato YYYY-MM-DD')
      .custom((value) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Fecha inválida');
        }
        return true;
      }),
    
    query('patientId')
      .optional()
      .trim()
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido')
  ],
  
  registerPayment: [
    body('appointmentId')
      .notEmpty().withMessage('El ID de la cita es requerido')
      .isUUID().withMessage('El ID de la cita debe ser un UUID válido'),
    
    body('patientId')
      .notEmpty().withMessage('El ID del paciente es requerido')
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido'),
    
    body('date')
      .notEmpty().withMessage('La fecha es requerida')
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha debe tener formato YYYY-MM-DD')
      .custom((value) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Fecha inválida');
        }
        return true;
      }),
    
    body('concept')
      .notEmpty().withMessage('El concepto es requerido')
      .trim()
      .isLength({ min: 3, max: 255 }).withMessage('El concepto debe tener entre 3 y 255 caracteres'),
    
    body('amount')
      .notEmpty().withMessage('El monto es requerido')
      .isFloat({ min: 0 }).withMessage('El monto debe ser mayor a 0')
      .custom((value) => {
        if (value > 999999.99) {
          throw new Error('El monto no puede exceder 999,999.99');
        }
        return true;
      }),
    
    body('method')
      .notEmpty().withMessage('El método de pago es requerido')
      .isIn(['efectivo', 'qr']).withMessage('El método de pago debe ser "efectivo" o "qr"')
  ]
};

module.exports = billingValidations;