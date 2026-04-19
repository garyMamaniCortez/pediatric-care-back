const express = require("express");
const router = express.Router();
const priceListController = require("../controllers/priceListController");
const { authenticate } = require("../middleware/loginMiddleware");
const priceListValidations = require("../validators/priceListValidator");

router.use(authenticate);

router.get("/", priceListController.getServices);
router.post("/", priceListValidations.create, priceListController.addService);
router.put("/:id", priceListValidations.update, priceListController.updateService);
router.delete("/:id", priceListValidations.delete, priceListController.deleteService);

module.exports = router;