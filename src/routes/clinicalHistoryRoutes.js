const express = require("express");
const router = express.Router();
const clinicalHistoryController = require("../controllers/clinicalHistoryController");
const { authenticate } = require("../middleware/loginMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const clinicalHistoryValidations = require("../validators/clinicalHistoryValidator");

// Clinical Records
router.get(
  "/patient/:patientId",
  authenticate,
  clinicalHistoryController.getClinicalRecords
);

router.post(
  "/",
  authenticate,
  clinicalHistoryValidations.createClinicalRecord,
  validate,
  clinicalHistoryController.createClinicalRecord
);

router.put(
  "/:id",
  authenticate,
  clinicalHistoryValidations.updateClinicalRecord,
  validate,
  clinicalHistoryController.updateClinicalRecord
);

// Prescriptions
router.get(
  "/prescriptions/patient/:patientId",
  authenticate,
  clinicalHistoryController.getPrescriptions
);

router.post(
  "/prescriptions",
  authenticate,
  clinicalHistoryValidations.createPrescription,
  validate,
  clinicalHistoryController.createPrescription
);

// Medical Certificates
router.get(
  "/certificates/patient/:patientId",
  authenticate,
  clinicalHistoryController.getCertificates
);

router.post(
  "/certificates",
  authenticate,
  clinicalHistoryValidations.createCertificate,
  validate,
  clinicalHistoryController.createCertificate
);

// Indications
router.get(
  "/indications/patient/:patientId",
  authenticate,
  clinicalHistoryController.getIndications
);

router.post(
  "/indications",
  authenticate,
  clinicalHistoryValidations.createIndication,
  validate,
  clinicalHistoryController.createIndication
);

module.exports = router;