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
router.get(
  "/usuarios/propietarios",
  verificarRol(["admin"]),
  authController.getPropietarios
);

// Obtener usuario por ID (nombre y teléfono)
router.get("/usuarios/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await require("../db").query(
      "SELECT nombre, telefono FROM usuarios WHERE id = $1",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

module.exports = router;
