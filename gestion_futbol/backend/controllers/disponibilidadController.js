const pool = require("../db");

// Agregar una nueva disponibilidad
exports.addDisponibilidad = async (req, res) => {
  const { cancha_id, fecha, hora_inicio, hora_fin } = req.body;
  try {
    // Validar que la hora_inicio y hora_fin sean en horas exactas (minutos "00")
    const [hInicio, mInicio] = (hora_inicio || "").split(":");
    const [hFin, mFin] = (hora_fin || "").split(":");
    if (mInicio !== "00" || mFin !== "00") {
      return res.status(400).json({ error: "Solo se permiten horarios en horas exactas (por ejemplo, 09:00, 10:00, etc)." });
    }

    // Validar que no exista ya un horario igual para la misma cancha
    const existe = await pool.query(
      `SELECT 1 FROM disponibilidades 
       WHERE cancha_id = $1 AND fecha = $2 AND hora_inicio = $3 AND hora_fin = $4`,
      [cancha_id, fecha, hora_inicio, hora_fin]
    );
    if (existe.rowCount > 0) {
      return res.status(400).json({ error: "Ya existe un horario para esa cancha en esa fecha y hora." });
    }

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
