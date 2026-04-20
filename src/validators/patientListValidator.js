const { query, param, body } = require('express-validator');

const patientListValidations = {
  getPatients: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser entre 1 y 100')
      .toInt(),
    
    query('gender')
      .optional()
      .isIn(['masculino', 'femenino', 'todos']).withMessage('Género no válido'),
    
    query('minAge')
      .optional()
      .isInt({ min: 0, max: 120 }).withMessage('La edad mínima debe ser entre 0 y 120 años')
      .toInt(),
    
    query('maxAge')
      .optional()
      .isInt({ min: 0, max: 120 }).withMessage('La edad máxima debe ser entre 0 y 120 años')
      .toInt()
      .custom((value, { req }) => {
        const minAge = parseInt(req.query.minAge);
        if (minAge && value < minAge) {
          throw new Error('La edad máxima no puede ser menor que la edad mínima');
        }
        return true;
      }),
    
    query('relationship')
      .optional()
      .isIn(['padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'otro', 'todos'])
      .withMessage('Relación de apoderado no válida'),
    
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('La búsqueda no puede exceder los 100 caracteres')
      .escape()
  ],

  updatePatient: [
    param('id')
      .notEmpty().withMessage('El ID del paciente es requerido')
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido'),
    
    body('name')
      .optional()
      .trim()
      .notEmpty().withMessage('El nombre no puede estar vacío')
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
      .matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
    
    body('birthDate')
      .optional()
      .notEmpty().withMessage('La fecha de nacimiento no puede estar vacía')
      .isISO8601().withMessage('La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (age > 120 || (age === 120 && monthDiff > 0)) {
          throw new Error('La edad no puede ser mayor a 120 años');
        }
        
        if (birthDate > today) {
          throw new Error('La fecha de nacimiento no puede ser futura');
        }
        
        return true;
      }),
    
    body('gender')
      .optional()
      .isIn(['masculino', 'femenino']).withMessage('Género no válido. Debe ser "masculino" o "femenino"'),
    
    body('bloodType')
      .optional()
      .trim()
      .matches(/^(A|B|AB|O)[+-]$/).withMessage('Tipo de sangre no válido. Debe ser A+, A-, B+, B-, AB+, AB-, O+ u O-'),
    
    body('allergies')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Las alergias no pueden exceder los 500 caracteres')
      .escape(),
    
    body('baseCondition')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('La condición base no puede exceder los 500 caracteres')
      .escape(),
    
    body('guardians')
      .optional()
      .isArray().withMessage('Los apoderados deben ser un array'),
    
    body('guardians.*.name')
      .optional()
      .trim()
      .notEmpty().withMessage('El nombre del apoderado no puede estar vacío')
      .isLength({ min: 2, max: 100 }).withMessage('El nombre del apoderado debe tener entre 2 y 100 caracteres'),
    
    body('guardians.*.phone')
      .optional()
      .trim()
      .notEmpty().withMessage('El teléfono del apoderado no puede estar vacío')
      .matches(/^\d+$/).withMessage('El teléfono solo debe contener números')
      .isLength({ min: 7, max: 15 }).withMessage('El teléfono debe tener entre 7 y 15 dígitos'),
    
    body('guardians.*.relationship')
      .optional()
      .isIn(['padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'otro'])
      .withMessage('Relación de apoderado no válida'),
    
    body('guardians.*.relationshipOther')
      .optional()
      .trim()
      .custom((value, { req }) => {
        const relationship = req.body.relationship;
        if (relationship === 'otro' && (!value || value.trim() === '')) {
          throw new Error('Debe especificar la relación cuando selecciona "otro"');
        }
        if (value && value.length > 50) {
          throw new Error('La relación personalizada no puede exceder los 50 caracteres');
        }
        return true;
      })
  ],

  deletePatient: [
    param('id')
      .notEmpty().withMessage('El ID del paciente es requerido')
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido')
  ]
};

module.exports = patientListValidations;