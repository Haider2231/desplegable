const express = require("express");
const router = express.Router();
const path = require("path");
const facturaController = require("../controllers/facturaController");
const { verificarToken } = require("../middlewares/authMiddleware");
const pool = require("../db");

// Descargar factura PDF
router.get("/:facturaId/pdf", (req, res) => {
  const facturaId = req.params.facturaId;
  const pdfPath = path.join(__dirname, "..", "uploads", `factura_${facturaId}.pdf`);
  res.download(pdfPath, `factura_${facturaId}.pdf`);
});

router.get("/cancha/:cancha_id", verificarToken, facturaController.getFacturasByCancha);

// Nuevo endpoint: obtener factura por disponibilidad
router.get("/disponibilidad/:id", facturaController.getFacturaByDisponibilidad);

module.exports = router;
