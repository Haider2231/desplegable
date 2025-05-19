const express = require("express");
const router = express.Router();
const canchaController = require("../controllers/canchaController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

// Cambia "dueño" por "propietario" en los roles permitidos
router.get("/", verificarToken, canchaController.getCanchas);
router.post("/", verificarToken, verificarRol(["propietario", "admin"]), upload.array("imagenes", 5), canchaController.createCancha);

module.exports = router;
