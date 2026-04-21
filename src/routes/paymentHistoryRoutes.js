const express = require("express");
const router = express.Router();
const paymentHistoryController = require("../controllers/paymentHistoryController");
const { authenticate } = require("../middleware/loginMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const paymentHistoryValidations = require("../validators/paymentHistoryValidator");

router.get(
  "/", 
  authenticate, 
  paymentHistoryValidations.getPayments,
  validate,
  paymentHistoryController.getPayments
);

module.exports = router;