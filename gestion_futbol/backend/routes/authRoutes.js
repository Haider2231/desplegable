const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/usuarios", authController.registerUser);
router.post("/verificar", authController.verifyUser);

module.exports = router;
