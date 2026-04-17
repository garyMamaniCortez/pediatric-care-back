const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");
const { authenticate } = require("../middleware/loginMiddleware");

router.post("/login", loginController.login);
router.get("/verify", authenticate, loginController.verifyToken);
router.post("/logout", loginController.logout);

module.exports = router;
