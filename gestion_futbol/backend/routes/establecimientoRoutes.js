const express = require("express");
const router = express.Router();
const establecimientoController = require("../controllers/establecimientoController");
const canchaController = require("../controllers/canchaController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configura multer para imagen de establecimiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

// POST: Crear establecimiento (soporta imagen)
router.post(
  "/",
  verificarToken,
  verificarRol(["propietario", "admin"]),
  upload.single("imagen"),
  establecimientoController.createEstablecimiento
);

// GET: Establecimientos por dueño
router.get("/dueno/:dueno_id", verificarToken, establecimientoController.getEstablecimientosByDueno);

// GET: Lista todos los establecimientos (para el mapa)
router.get("/", establecimientoController.getAllEstablecimientos);

// GET: Lista las canchas de un establecimiento
router.get("/:id/canchas", canchaController.getCanchasByEstablecimiento);

// NUEVO: Lista las canchas de un establecimiento CON sus horarios
router.get("/:id/canchas-con-horarios", canchaController.getCanchasConHorariosByEstablecimiento);

module.exports = router;
