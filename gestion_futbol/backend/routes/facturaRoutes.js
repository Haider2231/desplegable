const express = require("express");
const router = express.Router();
const path = require("path");
const facturaController = require("../controllers/facturaController");
const { verificarToken } = require("../middlewares/authMiddleware");
const pool = require("../db");

// Descargar factura PDF y enviar por correo si se pasa ?enviarCorreo=1
router.get("/:facturaId/pdf", (req, res) => {
  const facturaId = req.params.facturaId;
  const pdfPath = path.join(__dirname, "..", "uploads", `factura_${facturaId}.pdf`);
  res.download(pdfPath, `factura_${facturaId}.pdf`);
});

router.get("/cancha/:cancha_id", verificarToken, facturaController.getFacturasByCancha);

// Nuevo endpoint: obtener factura por disponibilidad
router.get("/disponibilidad/:id", facturaController.getFacturaByDisponibilidad);

module.exports = router;

// Cuando generes la factura (por ejemplo, en el endpoint de crear reserva o factura), llama a generarYEnviarFactura
// Ejemplo de uso en tu endpoint de creación de factura/reserva:

// router.post("/crear", async (req, res) => {
//   // ...genera la factura y obtén facturaId y userEmail...
//   await facturaController.generarYEnviarFactura(facturaId, userEmail);
//   // ...devuelve la respuesta...
