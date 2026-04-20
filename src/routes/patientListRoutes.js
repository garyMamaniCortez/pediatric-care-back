const express = require("express");
const router = express.Router();
const patientListController = require("../controllers/patientListController");
const { authenticate } = require("../middleware/loginMiddleware");
const patientListValidations = require("../validators/patientListValidator");
const { validate } = require("../middleware/validationMiddleware");

router.use(authenticate);

router.get(
  "/", 
  patientListValidations.getPatients,
  validate,
  patientListController.getPatients
);

router.put(
  "/:id", 
  patientListValidations.updatePatient,
  validate,
  patientListController.updatePatient
);

router.delete(
  "/:id", 
  patientListValidations.deletePatient,
  validate,
  patientListController.deletePatient
);

module.exports = router;