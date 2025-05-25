const express = require("express");
const router = express.Router();
const path = require("path");
const facturaController = require("../controllers/facturaController");
const { verificarToken } = require("../middlewares/authMiddleware");

// Descargar factura PDF
router.get("/:facturaId/pdf", (req, res) => {
  const facturaId = req.params.facturaId;
  const pdfPath = path.join(__dirname, "..", "uploads", `factura_${facturaId}.pdf`);
  res.download(pdfPath, `factura_${facturaId}.pdf`);
});

router.get("/cancha/:cancha_id", verificarToken, facturaController.getFacturasByCancha);

// Nuevo endpoint: obtener factura por disponibilidad
router.get("/disponibilidad/:disponibilidad_id", async (req, res) => {
  const { disponibilidad_id } = req.params;
  const pool = require("../db");
  try {
    // Busca la factura asociada a la disponibilidad
    const result = await pool.query(
      `SELECT f.abono, f.restante
       FROM facturas f
       JOIN reservas r ON f.reserva_id = r.id
       WHERE r.disponibilidad_id = $1
       ORDER BY f.id DESC
       LIMIT 1`,
      [disponibilidad_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No hay factura para esta disponibilidad" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la factura de la disponibilidad" });
  }
});

module.exports = router;
