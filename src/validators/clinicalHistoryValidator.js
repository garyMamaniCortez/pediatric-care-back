const { body } = require("express-validator");

const clinicalHistoryValidations = {
  createClinicalRecord: [
    body("appointmentId")
      .trim()
      .notEmpty()
      .withMessage("El ID de la cita es requerido")
      .isUUID()
      .withMessage("El ID de la cita debe ser un UUID válido"),

    body("patientId")
      .trim()
      .notEmpty()
      .withMessage("El ID del paciente es requerido")
      .isUUID()
      .withMessage("El ID del paciente debe ser un UUID válido"),

    body("date")
      .trim()
      .notEmpty()
      .withMessage("La fecha es requerida")
      .isISO8601()
      .withMessage("La fecha debe tener un formato válido"),

    body("weight")
      .notEmpty()
      .withMessage("El peso es requerido")
      .isFloat({ min: 0.1, max: 300 })
      .withMessage("El peso debe ser un número entre 0.1 y 300 kg"),

    body("height")
      .notEmpty()
      .withMessage("La altura es requerida")
      .isFloat({ min: 0.1, max: 300 })
      .withMessage("La altura debe ser un número entre 0.1 y 300 cm"),

    body("notes")
      .optional()
      .trim()
      .isString()
      .withMessage("Las notas deben ser texto"),

    body("diagnosis")
      .optional()
      .trim()
      .isString()
      .withMessage("El diagnóstico debe ser texto"),
  ],

  updateClinicalRecord: [
    body("weight")
      .optional()
      .isFloat({ min: 0.1, max: 300 })
      .withMessage("El peso debe ser un número entre 0.1 y 300 kg"),

    body("height")
      .optional()
      .isFloat({ min: 0.1, max: 300 })
      .withMessage("La altura debe ser un número entre 0.1 y 300 cm"),

    body("notes")
      .optional()
      .trim()
      .isString()
      .withMessage("Las notas deben ser texto"),

    body("diagnosis")
      .optional()
      .trim()
      .isString()
      .withMessage("El diagnóstico debe ser texto"),
  ],

  createPrescription: [
    body("clinicalRecordId")
      .trim()
      .notEmpty()
      .withMessage("El ID del registro clínico es requerido")
      .isUUID()
      .withMessage("El ID del registro clínico debe ser un UUID válido"),

    body("patientId")
      .trim()
      .notEmpty()
      .withMessage("El ID del paciente es requerido")
      .isUUID()
      .withMessage("El ID del paciente debe ser un UUID válido"),

    body("date")
      .trim()
      .notEmpty()
      .withMessage("La fecha es requerida")
      .isISO8601()
      .withMessage("La fecha debe tener un formato válido"),

    body("medications")
      .isArray({ min: 1 })
      .withMessage("Debe incluir al menos un medicamento"),

    body("medications.*.name")
      .trim()
      .notEmpty()
      .withMessage("El nombre del medicamento es requerido")
      .isLength({ max: 150 })
      .withMessage("El nombre del medicamento no puede exceder 150 caracteres"),

    body("medications.*.presentation")
      .trim()
      .notEmpty()
      .withMessage("La presentación del medicamento es requerida")
      .isLength({ max: 100 })
      .withMessage("La presentación no puede exceder 100 caracteres"),

    body("medications.*.instructions")
      .trim()
      .notEmpty()
      .withMessage("Las instrucciones del medicamento son requeridas"),
  ],

  createCertificate: [
    body("patientId")
      .trim()
      .notEmpty()
      .withMessage("El ID del paciente es requerido")
      .isUUID()
      .withMessage("El ID del paciente debe ser un UUID válido"),

    body("clinicalRecordId")
      .trim()
      .notEmpty()
      .withMessage("El ID del registro clínico es requerido")
      .isUUID()
      .withMessage("El ID del registro clínico debe ser un UUID válido"),

    body("date")
      .trim()
      .notEmpty()
      .withMessage("La fecha es requerida")
      .isISO8601()
      .withMessage("La fecha debe tener un formato válido"),

    body("content")
      .trim()
      .notEmpty()
      .withMessage("El contenido del certificado es requerido"),
  ],

  createIndication: [
    body("patientId")
      .trim()
      .notEmpty()
      .withMessage("El ID del paciente es requerido")
      .isUUID()
      .withMessage("El ID del paciente debe ser un UUID válido"),

    body("clinicalRecordId")
      .trim()
      .notEmpty()
      .withMessage("El ID del registro clínico es requerido")
      .isUUID()
      .withMessage("El ID del registro clínico debe ser un UUID válido"),

    body("date")
      .trim()
      .notEmpty()
      .withMessage("La fecha es requerida")
      .isISO8601()
      .withMessage("La fecha debe tener un formato válido"),

    body("content")
      .trim()
      .notEmpty()
      .withMessage("El contenido de la indicación es requerido"),
  ],
};

module.exports = clinicalHistoryValidations;