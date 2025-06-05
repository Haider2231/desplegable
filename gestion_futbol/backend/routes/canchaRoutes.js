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

// GET /canchas?establecimiento_id=ID
router.get("/", canchaController.getCanchas);

// POST /canchas (solo establecimiento_id)

// POST /canchas (solo establecimiento_id)
router.post(
  "/",
  verificarToken,
  verificarRol(["propietario", "admin"]),
  // Acepta hasta 5 imágenes y 5 documentos (puedes ajustar el límite)
  require("multer")({ storage }).fields([
    { name: "imagenes", maxCount: 5 },
    { name: "documentos", maxCount: 5 }
  ]),
  canchaController.createCancha
);

// GET: Documentos de cancha
router.get("/documentos/:cancha_id", async (req, res) => {
  const pool = require("../db");
  const cancha_id = req.params.cancha_id;
  try {
    const result = await pool.query(
      "SELECT id, url, tipo FROM documentos_cancha WHERE cancha_id = $1",
      [cancha_id]
    );
    const docs = result.rows.map(doc => ({
      ...doc,
      url: doc.url.startsWith("http")
        ? doc.url
        : `${process.env.BACKEND_URL || "https://canchassinteticas.site"}${doc.url}`
    }));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener documentos" });
  }
});

// GET: Canchas pendientes (validador)
router.get("/pendientes", verificarToken, verificarRol(["validador"]), canchaController.getCanchasPendientes);

// POST: Validar cancha (validador)
router.post("/:cancha_id/validar", verificarToken, verificarRol(["validador"]), canchaController.validarCancha);


module.exports = router;
