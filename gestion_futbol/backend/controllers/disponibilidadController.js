const pool = require("../db");

// Agregar una nueva disponibilidad
exports.addDisponibilidad = async (req, res) => {
  const { cancha_id, fecha, hora_inicio, hora_fin } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO disponibilidades (cancha_id, fecha, hora_inicio, hora_fin) VALUES ($1, $2, $3, $4) RETURNING *",
      [cancha_id, fecha, hora_inicio, hora_fin]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al agregar disponibilidad:", error);
    res.status(500).json({ error: "Error al agregar disponibilidad" });
  }
};

// Obtener disponibilidades por cancha
exports.getDisponibilidadesByCancha = async (req, res) => {
  const { cancha_id } = req.params;
  if (isNaN(cancha_id)) {
    return res.status(400).json({ error: "El ID de la cancha debe ser un número válido." });
  }
  try {
    const result = await pool.query(
      `SELECT id, fecha, hora_inicio, hora_fin, disponible
       FROM disponibilidades
       WHERE cancha_id = $1 AND disponible = true`,
      [parseInt(cancha_id)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener las disponibilidades de la cancha:", error);
    res.status(500).json({ error: "Error al obtener las disponibilidades de la cancha" });
  }
};
