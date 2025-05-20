const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/usuarios", authController.registerUser);
router.post("/verificar", authController.verifyUser);
 router.post("/forgot-password", authController.forgotPassword);
 router.post("/reset-password", authController.resetPassword);
 router.post("/check-email", authController.checkEmailExists);

module.exports = router;
