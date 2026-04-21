const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const { authenticate } = require("../middleware/loginMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const billingValidations = require("../validators/billingValidator");

router.get(
  "/pending", 
  authenticate, 
  billingValidations.getPendingPayments,
  validate,
  billingController.getPendingPayments
);

router.post(
  "/payments", 
  authenticate, 
  billingValidations.registerPayment,
  validate,
  billingController.registerPayment
);

module.exports = router;