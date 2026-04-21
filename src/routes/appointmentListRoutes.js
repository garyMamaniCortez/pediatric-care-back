const express = require("express");
const router = express.Router();
const appointmentListController = require("../controllers/appointmentListController");
const { authenticate } = require("../middleware/loginMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const appointmentListValidations = require("../validators/appointmentListValidator");

router.get(
  "/", 
  authenticate, 
  appointmentListValidations.getAppointments,
  validate,
  appointmentListController.getAppointments
);

router.post(
  "/", 
  authenticate, 
  appointmentListValidations.createAppointment,
  validate,
  appointmentListController.createAppointment
);

router.put(
  "/:id", 
  authenticate, 
  appointmentListValidations.updateAppointment,
  validate,
  appointmentListController.updateAppointment
);

router.patch(
  "/:id/cancel", 
  authenticate, 
  appointmentListValidations.cancelAppointment,
  validate,
  appointmentListController.cancelAppointment
);

module.exports = router;