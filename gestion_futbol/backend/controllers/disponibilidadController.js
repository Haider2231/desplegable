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

// Obtener disponibilidades por cancha (solo FUTUROS)
exports.getDisponibilidadesByCancha = async (req, res) => {
  const { cancha_id } = req.params;
  if (isNaN(cancha_id)) {
    return res.status(400).json({ error: "El ID de la cancha debe ser un número válido." });
  }
  try {
    const now = new Date();
    const fechaHoy = now.toISOString().slice(0, 10);
    const horaAhora = now.toTimeString().slice(0, 5);
    const result = await pool.query(
      `SELECT id, fecha, hora_inicio, hora_fin, disponible
       FROM disponibilidades
       WHERE cancha_id = $1 AND disponible = true
         AND (fecha > $2 OR (fecha = $2 AND hora_fin > $3))
       ORDER BY fecha, hora_inicio`,
      [parseInt(cancha_id), fechaHoy, horaAhora]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener las disponibilidades de la cancha:", error);
    res.status(500).json({ error: "Error al obtener las disponibilidades de la cancha" });
  }
};

// Crear múltiples disponibilidades en lote (sin duplicados)
exports.addDisponibilidadesBatch = async (req, res) => {
  const { cancha_id, fecha, hora_inicio, hora_fin, intervalo } = req.body;
  try {
    const horarios = [];
    let [h, m] = hora_inicio.split(":").map(Number);
    const [hFin, mFin] = hora_fin.split(":").map(Number);
    while (h < hFin || (h === hFin && m < mFin)) {
      const inicio = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      let finH = h, finM = m + intervalo;
      if (finM >= 60) {
        finH += Math.floor(finM / 60);
        finM = finM % 60;
      }
      if (finH > hFin || (finH === hFin && finM > mFin)) break;
      const fin = `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`;
      horarios.push({ cancha_id, fecha, hora_inicio: inicio, hora_fin: fin });
      h = finH;
      m = finM;
    }
    if (horarios.length === 0) return res.status(400).json({ error: "No se generaron horarios" });

    // Verifica duplicados
    const checks = await Promise.all(horarios.map(h =>
      pool.query(
        `SELECT 1 FROM disponibilidades WHERE cancha_id = $1 AND fecha = $2 AND hora_inicio = $3 AND hora_fin = $4`,
        [h.cancha_id, h.fecha, h.hora_inicio, h.hora_fin]
      )
    ));
    const nuevos = horarios.filter((h, idx) => checks[idx].rowCount === 0);
    if (nuevos.length === 0) return res.status(400).json({ error: "Todos los horarios ya existen" });

    const values = nuevos.map(
      h => `(${h.cancha_id}, '${h.fecha}', '${h.hora_inicio}', '${h.hora_fin}')`
    ).join(",");
    await pool.query(
      `INSERT INTO disponibilidades (cancha_id, fecha, hora_inicio, hora_fin) VALUES ${values}`
    );
    res.status(201).json({ message: "Horarios generados", cantidad: nuevos.length });
  } catch (error) {
    console.error("Error al agregar horarios en lote:", error);
    res.status(500).json({ error: "Error al agregar horarios en lote" });
  }
};

// Eliminar un horario disponible
exports.deleteDisponibilidad = async (req, res) => {
  const { id } = req.params;
  try {
    // Solo permite eliminar si está disponible y es futuro
    const now = new Date();
    const fechaHoy = now.toISOString().slice(0, 10);
    const horaAhora = now.toTimeString().slice(0, 5);
    const result = await pool.query(
      `DELETE FROM disponibilidades
       WHERE id = $1 AND disponible = true
         AND (fecha > $2 OR (fecha = $2 AND hora_fin > $3))
       RETURNING *`,
      [id, fechaHoy, horaAhora]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No se puede eliminar este horario (ya reservado o pasado)" });
    }
    res.json({ message: "Horario eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el horario" });
  }
};
