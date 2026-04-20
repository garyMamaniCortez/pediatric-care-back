const { body, query } = require('express-validator');

const scheduleAppointmentValidations = {
  createPatient: [
    body('name')
      .trim()
      .notEmpty().withMessage('El nombre del paciente es requerido')
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('birthDate')
      .trim()
      .notEmpty().withMessage('La fecha de nacimiento es requerida')
      .isISO8601().withMessage('La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (age > 18 || (age === 18 && monthDiff >= 0)) {
          throw new Error('El paciente debe ser menor de 18 años');
        }
        if (age < 0) {
          throw new Error('La fecha de nacimiento no puede ser futura');
        }
        return true;
      }),
    
    body('gender')
      .trim()
      .notEmpty().withMessage('El género es requerido')
      .isIn(['masculino', 'femenino']).withMessage('El género debe ser "masculino" o "femenino"'),
    
    body('bloodType')
      .trim()
      .optional()
      .matches(/^(A|B|AB|O)[+-]$/).withMessage('El tipo de sangre debe tener formato válido (Ej: A+, O-, AB+)'),
    
    body('allergies')
      .trim()
      .optional()
      .isLength({ max: 500 }).withMessage('Las alergias no pueden exceder 500 caracteres'),
    
    body('baseCondition')
      .trim()
      .optional()
      .isLength({ max: 500 }).withMessage('La condición base no puede exceder 500 caracteres'),
    
    body('guardians')
      .isArray({ min: 1 }).withMessage('Debe proporcionar al menos un apoderado')
      .custom((value) => {
        if (!value || value.length === 0) {
          throw new Error('Debe proporcionar al menos un apoderado');
        }
        return true;
      }),
    
    body('guardians.*.name')
      .trim()
      .notEmpty().withMessage('El nombre del apoderado es requerido')
      .isLength({ min: 2, max: 100 }).withMessage('El nombre del apoderado debe tener entre 2 y 100 caracteres'),
    
    body('guardians.*.phone')
      .trim()
      .notEmpty().withMessage('El teléfono del apoderado es requerido')
      .matches(/^[0-9+\-\s()]+$/).withMessage('El teléfono contiene caracteres inválidos')
      .isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 caracteres'),
    
    body('guardians.*.relationship')
      .trim()
      .notEmpty().withMessage('La relación del apoderado es requerida')
      .isIn(['padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'otro']).withMessage('Relación no válida'),
    
    body('guardians.*.relationshipOther')
      .trim()
      .optional()
      .custom((value, { req }) => {
        const relationship = req.body.relationship;
        if (relationship === 'otro' && (!value || value.trim() === '')) {
          throw new Error('Debe especificar la relación cuando selecciona "otro"');
        }
        if (value && value.length > 50) {
          throw new Error('La especificación de relación no puede exceder 50 caracteres');
        }
        return true;
      })
  ],
  
  searchPatient: [
    query('q')
      .trim()
      .notEmpty().withMessage('El término de búsqueda es requerido')
      .isLength({ min: 2, max: 100 }).withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres')
      .matches(/^[a-zA-ZáéíóúñÑÁÉÍÓÚ0-9\s]+$/).withMessage('El término de búsqueda contiene caracteres inválidos')
  ],
  
  scheduleAppointment: [
    body('patientId')
      .trim()
      .notEmpty().withMessage('El ID del paciente es requerido')
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido'),
    
    body('serviceId')
      .trim()
      .notEmpty().withMessage('El ID del servicio es requerido')
      .isUUID().withMessage('El ID del servicio debe ser un UUID válido'),
    
    body('date')
      .trim()
      .notEmpty().withMessage('La fecha es requerida')
      .isISO8601().withMessage('La fecha debe tener formato válido (YYYY-MM-DD)')
      .custom((value) => {
        const appointmentDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
          throw new Error('No se pueden agendar citas en fechas pasadas');
        }
        
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        if (appointmentDate > maxDate) {
          throw new Error('No se pueden agendar citas con más de 3 meses de anticipación');
        }
        
        return true;
      }),
    
    body('time')
      .trim()
      .notEmpty().withMessage('La hora es requerida')
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe tener formato HH:MM')
      .custom((value) => {
        const [hours, minutes] = value.split(':').map(Number);
        
        if (hours < 8 || hours > 20) {
          throw new Error('Las citas solo pueden agendarse entre 8:00 y 18:00 horas');
        }
        
        if (hours === 20 && minutes > 0) {
          throw new Error('Las citas solo pueden agendarse hasta las 20:00 horas');
        }
        
        if (minutes !== 0 && minutes !== 30) {
          throw new Error('Las citas solo pueden agendarse cada 30 minutos (HH:00 o HH:30)');
        }
        
        return true;
      })
  ],
  
  getBusyTimes: [
    query('date')
      .trim()
      .notEmpty().withMessage('La fecha es requerida')
      .isISO8601().withMessage('La fecha debe tener formato válido (YYYY-MM-DD)')
      .custom((value) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) {
          throw new Error('No se pueden consultar horarios de fechas pasadas');
        }
        
        return true;
      })
  ],
  
  updatePatient: [
    body('id')
      .trim()
      .notEmpty().withMessage('El ID del paciente es requerido')
      .isUUID().withMessage('El ID del paciente debe ser un UUID válido'),
    
    body('name')
      .trim()
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('birthDate')
      .trim()
      .optional()
      .isISO8601().withMessage('La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age > 18) {
          throw new Error('El paciente debe ser menor de 18 años');
        }
        if (age < 0) {
          throw new Error('La fecha de nacimiento no puede ser futura');
        }
        return true;
      }),
    
    body('gender')
      .trim()
      .optional()
      .isIn(['masculino', 'femenino']).withMessage('El género debe ser "masculino" o "femenino"'),
    
    body('bloodType')
      .trim()
      .optional()
      .matches(/^(A|B|AB|O)[+-]$/).withMessage('El tipo de sangre debe tener formato válido (Ej: A+, O-, AB+)'),
    
    body('allergies')
      .trim()
      .optional()
      .isLength({ max: 500 }).withMessage('Las alergias no pueden exceder 500 caracteres'),
    
    body('baseCondition')
      .trim()
      .optional()
      .isLength({ max: 500 }).withMessage('La condición base no puede exceder 500 caracteres')
  ],
	
  updateAppointment: [
    body('status')
      .optional()
      .isIn(['pendiente', 'completada', 'cancelada']).withMessage('Estado inválido'),
    
    body('date')
      .optional()
      .isISO8601().withMessage('Formato de fecha inválido')
      .custom((value) => {
        const appointmentDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
          throw new Error('No se pueden reprogramar citas en fechas pasadas');
        }
        return true;
      }),
    
    body('time')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)')
      .custom((value) => {
        if (value && !AVAILABLE_TIMES.includes(value)) {
          throw new Error(`Horario no disponible. Horarios válidos: ${AVAILABLE_TIMES.join(', ')}`);
        }
        return true;
      })
  ]
};

module.exports = scheduleAppointmentValidations;