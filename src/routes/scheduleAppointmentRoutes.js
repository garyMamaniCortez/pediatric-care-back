const express = require("express");
const router = express.Router();
const scheduleAppointmentController = require("../controllers/scheduleAppointmentController");
const { validate } = require("../middleware/validationMiddleware");
const { authenticate } = require("../middleware/loginMiddleware");
const validations = require("../validators/scheduleAppointmentValidator");

router.use(authenticate);

router.post(
  "/patients", 
  validations.createPatient, 
  validate, 
  scheduleAppointmentController.createPatient
);

router.get(
  "/patients/search", 
  validations.searchPatient, 
  validate, 
  scheduleAppointmentController.searchPatient
);

router.post(
  "/appointments", 
  validations.scheduleAppointment, 
  validate, 
  scheduleAppointmentController.scheduleAppointment
);

router.get(
  "/appointments/busy-times", 
  validations.getBusyTimes, 
  validate, 
  scheduleAppointmentController.getBusyTimes
);

router.get(
  "/services", 
  scheduleAppointmentController.getServices
);

router.put(
  "/appointments/:appointmentId",
  validations.updateAppointment,
  validate,
  scheduleAppointmentController.updateAppointment
);

module.exports = router;