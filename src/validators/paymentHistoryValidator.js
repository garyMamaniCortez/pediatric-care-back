const { query } = require('express-validator');

const paymentHistoryValidations = {
  getPayments: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
      .toInt(),
    
    query('startDate')
      .optional()
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha de inicio debe tener formato YYYY-MM-DD')
      .custom((value) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Fecha de inicio inválida');
        }
        return true;
      }),
    
    query('endDate')
      .optional()
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha de fin debe tener formato YYYY-MM-DD')
      .custom((value, { req }) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Fecha de fin inválida');
        }
        
        if (req.query.startDate) {
          const startDate = new Date(req.query.startDate);
          const endDate = new Date(value);
          if (endDate < startDate) {
            throw new Error('La fecha de fin no puede ser menor a la fecha de inicio');
          }
        }
        return true;
      }),
    
    query('patientId')
      .optional()
      .trim()
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido')
  ]
};

module.exports = paymentHistoryValidations;