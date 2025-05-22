const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");

router.post("/login", authController.login);
router.post("/usuarios", authController.registerUser); // Registro público
router.post("/verificar", authController.verifyUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/check-email", authController.checkEmailExists);
// ENDPOINTS ADMIN USUARIOS
router.get(
  "/usuarios",
  verificarToken,
  verificarRol(["admin"]),
  authController.getUsuarios
);

router.post(
  "/usuarios/admin",
  verificarToken,
  verificarRol(["admin"]),
  authController.createUsuario
);

router.put(
  "/usuarios/:id",
  verificarToken,
  verificarRol(["admin"]),
  authController.updateUsuario
);

router.delete(
  "/usuarios/:id",
  verificarToken,
  verificarRol(["admin"]),
  authController.deleteUsuario
);

module.exports = router;
