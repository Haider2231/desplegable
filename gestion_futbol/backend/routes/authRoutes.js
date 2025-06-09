const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/login", authController.login);
router.post("/usuarios", authController.registerUser); // Registro público
router.post("/verificar", authController.verifyUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/check-email", authController.checkEmailExists);
router.post("/change-password", authMiddleware, authController.changePassword);

// ENDPOINTS ADMIN USUARIOS

// ENDPOINTS ADMIN USUARIOS
router.get(
  "/usuarios",
  verificarToken,
  verificarRol(["admin", "validador"]),
  authController.getUsuarios
);

router.post(
  "/usuarios",
  verificarToken,
  verificarRol(["admin", "validador"]),
  authController.createUsuario
);

router.put(
  "/usuarios/:id",
  verificarToken,
  verificarRol(["admin", "validador"]),
  authController.updateUsuario
);

router.delete(
  "/usuarios/:id",
  verificarToken,
  verificarRol(["admin", "validador"]),
  authController.deleteUsuario
);

router.get(
  "/usuarios/propietarios",
  verificarToken,
  verificarRol(["admin", "validador"]),
  authController.getPropietarios
);

// Obtener usuario por ID (nombre, email y teléfono)
router.get("/usuarios/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await require("../db").query(
      "SELECT id, nombre, email, telefono FROM usuarios WHERE id = $1",
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
