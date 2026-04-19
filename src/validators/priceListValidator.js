const { body, param } = require('express-validator');

const priceListValidations = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('El nombre del servicio es requerido')
      .isString()
      .withMessage('El nombre debe ser un texto')
      .isLength({ max: 100 })
      .withMessage('El nombre del servicio no puede exceder los 100 caracteres')
      .customSanitizer(value => value.trim()),
    
    body('price')
      .notEmpty()
      .withMessage('El precio del servicio es requerido')
      .custom(value => {
        if (value === null || value === undefined) {
          throw new Error('El precio del servicio es requerido');
        }
        
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(numValue)) {
          throw new Error('El precio debe ser un número válido');
        }
        
        if (numValue < 0) {
          throw new Error('El precio debe ser mayor o igual a 0');
        }
        
        return true;
      })
      .customSanitizer(value => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return numValue;
      })
  ],
  
  update: [
    param('id')
      .notEmpty()
      .withMessage('El ID del servicio es requerido')
      .isUUID()
      .withMessage('El ID del servicio debe ser un UUID válido'),
    
    body('name')
      .optional()
      .trim()
      .isString()
      .withMessage('El nombre debe ser un texto')
      .isLength({ max: 100 })
      .withMessage('El nombre del servicio no puede exceder los 100 caracteres')
      .customSanitizer(value => value ? value.trim() : undefined),
    
    body('price')
      .optional()
      .custom(value => {
        if (value === undefined || value === null) {
          return true;
        }

        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(numValue)) {
          throw new Error('El precio debe ser un número válido');
        }
        
        if (numValue < 0) {
          throw new Error('El precio debe ser mayor o igual a 0');
        }
        
        return true;
      })
      .customSanitizer(value => {
        if (value === undefined || value === null) {
          return undefined;
        }
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return numValue;
      }),
    
    body()
      .custom(value => {
        if (!value.name && value.price === undefined) {
          throw new Error('Debe proporcionar al menos un campo para actualizar');
        }
        return true;
      })
  ],
  
  delete: [
    param('id')
      .notEmpty()
      .withMessage('El ID del servicio es requerido')
      .isUUID()
      .withMessage('El ID del servicio debe ser un UUID válido')
  ],
  
  get: [
    body('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El número de página debe ser un entero mayor a 0')
      .customSanitizer(value => value ? parseInt(value) : 1),
    
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un entero entre 1 y 100')
      .customSanitizer(value => value ? parseInt(value) : 10)
  ]
};

module.exports = priceListValidations;