const pool = require("../db");

// Estadísticas para usuario (cliente)
exports.usuario = async (req, res) => {
  const userId = req.user.userId;
  try {
    // Total reservas y horas jugadas (JOIN reservas -> disponibilidades)
    const reservasRes = await pool.query(
      `SELECT COUNT(*) AS total_reservas, 
              COALESCE(SUM(EXTRACT(EPOCH FROM (d.hora_fin::time - d.hora_inicio::time))/3600),0) AS horas_jugadas
         FROM reservas r
         JOIN disponibilidades d ON r.disponibilidad_id = d.id
        WHERE r.usuario_id = $1`,
      [userId]
    );
    // Canchas más reservadas (JOIN reservas -> disponibilidades -> canchas)
    const canchasRes = await pool.query(
      `SELECT c.nombre, COUNT(*) AS reservas
         FROM reservas r
         JOIN disponibilidades d ON r.disponibilidad_id = d.id
         JOIN canchas c ON d.cancha_id = c.id
        WHERE r.usuario_id = $1
        GROUP BY c.nombre
        ORDER BY reservas DESC
        LIMIT 5`,
      [userId]
    );
    res.json({
      total_reservas: parseInt(reservasRes.rows[0].total_reservas),
      horas_jugadas: parseFloat(reservasRes.rows[0].horas_jugadas),
      canchas_mas_reservadas: canchasRes.rows.map(r => ({
        nombre: r.nombre,
        reservas: parseInt(r.reservas)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener estadísticas de usuario" });
  }
};

// Estadísticas para propietario
exports.propietario = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error("No hay usuario autenticado en la petición", req.user);
      return res.status(401).json({ error: "No autenticado" });
    }
    const userId = req.user.userId;
    console.log("userId:", userId);

    const canchasRes = await pool.query(
      `SELECT c.id, c.nombre FROM canchas c WHERE c.dueno_id = $1`,
      [userId]
    );
    console.log("canchasRes.rows:", canchasRes.rows);

    const canchaIds = canchasRes.rows.map(c => c.id);

    // Si no tiene canchas, responde con datos vacíos
    if (!canchaIds || canchaIds.length === 0) {
      return res.json({ total_reservas: 0, ingresos: 0, canchas: [] });
    }

    // Reservas por cancha (JOIN reservas -> disponibilidades -> canchas)
    const reservasPorCancha = await pool.query(
      `SELECT c.nombre, COUNT(r.id) AS reservas
         FROM canchas c
         LEFT JOIN disponibilidades d ON c.id = d.cancha_id
         LEFT JOIN reservas r ON d.id = r.disponibilidad_id
        WHERE c.dueno_id = $1
        GROUP BY c.nombre`,
      [userId]
    );
    // Ingresos estimados (ejemplo: 50.000 por reserva)
    const totalReservas = reservasPorCancha.rows.reduce((acc, c) => acc + parseInt(c.reservas), 0);
    const ingresos = totalReservas * 50000;
    res.json({
      total_reservas: totalReservas,
      ingresos,
      canchas: reservasPorCancha.rows.map(r => ({
        nombre: r.nombre,
        reservas: parseInt(r.reservas)
      }))
    });
  } catch (err) {
    console.error("Error en estadisticas propietario:", err);
    res.status(500).json({ error: "Error al obtener estadísticas de propietario" });
  }
};

// Estadísticas para admin
exports.admin = async (req, res) => {
  try {
    // Usuarios registrados
    const usuariosRes = await pool.query(`SELECT COUNT(*) FROM usuarios WHERE verificado = true`);
    // Canchas
    const canchasRes = await pool.query(`SELECT COUNT(*) FROM canchas`);
    // Reservas totales
    const reservasRes = await pool.query(`SELECT COUNT(*) FROM reservas`);
    // Actividad por día (últimos 7 días)
    // Cambia 'fecha' por el campo correcto, por ejemplo 'created_at' o 'fecha_reserva'
    const actividadRes = await pool.query(
      `SELECT TO_CHAR(r.fecha_reserva, 'YYYY-MM-DD') AS fecha, COUNT(*) AS reservas
         FROM reservas r
        WHERE r.fecha_reserva >= NOW() - INTERVAL '7 days'
        GROUP BY fecha
        ORDER BY fecha`
    );
    res.json({
      usuarios: parseInt(usuariosRes.rows[0].count),
      canchas: parseInt(canchasRes.rows[0].count),
      reservas: parseInt(reservasRes.rows[0].count),
      actividad: actividadRes.rows.map(r => ({
        fecha: r.fecha,
        reservas: parseInt(r.reservas)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener estadísticas de admin" });
  }
};
